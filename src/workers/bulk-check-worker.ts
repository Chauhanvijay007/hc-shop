import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { QUEUE_NAMES } from '@/lib/queue/types'
import type { BulkCheckJobData } from '@/lib/queue/types'
import { addUrlInspectionJob } from '@/lib/queue/queues'
import { prisma } from '@/lib/db/prisma'

export const bulkCheckWorker = new Worker<BulkCheckJobData>(
  QUEUE_NAMES.BULK_CHECK,
  async (job: Job<BulkCheckJobData>) => {
    const { projectId, userId, urlIds, checkType } = job.data

    console.log(
      `📦 [Job ${job.id}] Processing bulk check for ${urlIds.length} URLs ` +
      `(type: ${checkType}, project: ${projectId})`
    )

    try {
      // Get URL details
      const urls = await prisma.url.findMany({
        where: {
          id: { in: urlIds },
          projectId,
          isActive: true,
        },
        include: {
          project: {
            select: {
              searchConsoleProperty: true,
            },
          },
        },
      })

      console.log(`📋 [Job ${job.id}] Found ${urls.length} active URLs to check`)

      if (urls.length === 0) {
        return {
          success: true,
          totalUrls: 0,
          queued: 0,
          skipped: urlIds.length,
          failed: 0,
        }
      }

      // Create monitoring queue entries
      const queueEntries = urls.map((url) => ({
        urlId: url.id,
        scheduledAt: new Date(),
        status: 'pending' as const,
        retryCount: 0,
      }))

      // Batch create with skipDuplicates to handle concurrent requests
      await prisma.monitoringQueue.createMany({
        data: queueEntries,
        skipDuplicates: true,
      })

      console.log(`📥 [Job ${job.id}] Created ${queueEntries.length} monitoring queue entries`)

      // Add individual inspection jobs to the queue
      let successCount = 0
      let failCount = 0

      for (const url of urls) {
        try {
          // Priority mapping: high = 1, medium = 5, low = 10
          const priorityMap = { high: 1, medium: 5, low: 10 }
          const priority = priorityMap[url.priority] || 10

          await addUrlInspectionJob({
            urlId: url.id,
            projectId: url.projectId,
            url: url.url,
            siteUrl: url.project.searchConsoleProperty,
            userId,
            priority,
          })

          successCount++

          // Update job progress
          const progress = Math.floor(((successCount + failCount) / urls.length) * 100)
          await job.updateProgress(progress)
        } catch (error) {
          console.error(`❌ [Job ${job.id}] Failed to queue URL ${url.url}:`, error)
          failCount++
        }
      }

      const skippedCount = urlIds.length - urls.length

      console.log(
        `✅ [Job ${job.id}] Bulk check completed: ` +
        `${successCount} queued, ${failCount} failed, ${skippedCount} skipped`
      )

      return {
        success: true,
        totalUrls: urls.length,
        queued: successCount,
        failed: failCount,
        skipped: skippedCount,
      }
    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Bulk check error:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5, // Process 5 bulk check jobs concurrently
  }
)

// Worker event handlers
bulkCheckWorker.on('completed', (job, result) => {
  console.log(
    `✅ Bulk check job ${job.id} completed: ` +
    `${result.queued} queued, ${result.failed} failed, ${result.skipped} skipped`
  )
})

bulkCheckWorker.on('failed', (job, err) => {
  console.error(`❌ Bulk check job ${job?.id} failed:`, err.message)
})

bulkCheckWorker.on('error', (err) => {
  console.error('🚨 Bulk check worker error:', err)
})

console.log('🚀 Bulk Check Worker started')

export default bulkCheckWorker
