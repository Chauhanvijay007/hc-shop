import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { QUEUE_NAMES } from '@/lib/queue/types'
import type { UrlInspectionJobData, IndexingCheckResult } from '@/lib/queue/types'
import { googleURLInspection } from '@/lib/google-api/url-inspection'
import { prisma } from '@/lib/db/prisma'
import { detectStatusChange } from '@/lib/monitoring/change-detection'
import { addAlertCheckJob } from '@/lib/queue/queues'
import { IndexingState, CoverageState } from '@prisma/client'

// Rate limiter configuration (Google API limit: 600 requests per minute)
const RATE_LIMIT = {
  max: 600,
  duration: 60000, // 1 minute
}

export const urlInspectionWorker = new Worker<UrlInspectionJobData>(
  QUEUE_NAMES.URL_INSPECTION,
  async (job: Job<UrlInspectionJobData>) => {
    const { urlId, projectId, url, siteUrl, userId } = job.data

    console.log(`🔍 [Job ${job.id}] Inspecting URL: ${url}`)

    try {
      // Update monitoring queue status to processing
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId,
          status: 'pending',
        },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      // Call Google URL Inspection API
      console.log(`📡 [Job ${job.id}] Calling Google API for: ${url}`)

      const check = await googleURLInspection.inspectAndStore(
        userId,
        urlId,
        siteUrl,
        url
      )

      console.log(`✅ [Job ${job.id}] API call successful, check ID: ${check.id}`)

      // Update the URL's last checked timestamp
      await prisma.url.update({
        where: { id: urlId },
        data: {
          lastCheckedAt: new Date(),
        },
      })

      // Detect status changes
      const apiResult: IndexingCheckResult = {
        indexingState: check.indexingState,
        coverageState: check.coverageState,
        verdict: check.verdict || '',
        lastCrawlTime: check.lastCrawlTime?.toISOString(),
        crawlAllowed: check.crawlAllowed ?? true,
        pageFetchState: check.pageFetchState || 'UNKNOWN',
        robotsTxtState: check.robotsTxtState || 'UNKNOWN',
        userCanonical: check.userCanonical || undefined,
        googleCanonical: check.googleCanonical || undefined,
        sitemapDetected: check.sitemapDetected || undefined,
        referringUrl: check.referringUrl || undefined,
        mobileUsability: check.mobileUsability,
        richResults: check.richResults,
        rawApiResponse: check.rawApiResponse,
        errorMessage: check.errorMessage || undefined,
      }

      const changeDetected = await detectStatusChange(urlId, apiResult)

      if (changeDetected) {
        console.log(`⚠️ [Job ${job.id}] Status change detected for URL: ${url}`)

        // Add alert check job
        await addAlertCheckJob({
          projectId,
          urlId,
          changeId: changeDetected.id,
        })
      }

      // Update monitoring queue status to completed
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId,
          status: 'processing',
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })

      console.log(`✅ [Job ${job.id}] Successfully inspected URL: ${url}`)

      return {
        success: true,
        checkId: check.id,
        changeDetected: !!changeDetected,
        indexingState: check.indexingState,
      }
    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Error inspecting URL ${url}:`, error)

      // Update monitoring queue status to failed
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId,
          status: 'processing',
        },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Unknown error',
          completedAt: new Date(),
        },
      })

      // Increment retry count
      await prisma.monitoringQueue.updateMany({
        where: { urlId },
        data: {
          retryCount: {
            increment: 1,
          },
        },
      })

      // Re-throw to trigger BullMQ retry logic
      throw error
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 jobs concurrently
    limiter: RATE_LIMIT,
  }
)

// Worker event handlers
urlInspectionWorker.on('completed', (job, result) => {
  console.log(
    `✅ Job ${job.id} completed: ${result.changeDetected ? 'Change detected!' : 'No changes'} ` +
    `State: ${result.indexingState}`
  )
})

urlInspectionWorker.on('failed', (job, err) => {
  console.error(
    `❌ Job ${job?.id} failed after ${job?.attemptsMade}/${job?.opts.attempts} attempts:`,
    err.message
  )
})

urlInspectionWorker.on('error', (err) => {
  console.error('🚨 Worker error:', err)
})

urlInspectionWorker.on('stalled', (jobId) => {
  console.warn(`⏸️ Job ${jobId} stalled`)
})

console.log('🚀 URL Inspection Worker started')

export default urlInspectionWorker
