import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { googleURLInspection } from '@/lib/google-api/url-inspection'
import { prisma } from '@/lib/db/prisma'

interface UrlInspectionJob {
  userId: string
  projectId: string
  urlId: string
  url: string
  siteUrl: string
}

// URL Inspection Worker
const urlInspectionWorker = new Worker<UrlInspectionJob>(
  'url-inspection',
  async (job: Job<UrlInspectionJob>) => {
    console.log(`Processing URL inspection for: ${job.data.url}`)

    try {
      // Update queue status to processing
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId: job.data.urlId,
          status: 'pending',
        },
        data: {
          status: 'processing',
          startedAt: new Date(),
        },
      })

      // Perform the inspection
      await googleURLInspection.inspectAndStore(
        job.data.userId,
        job.data.urlId,
        job.data.siteUrl,
        job.data.url
      )

      // Update queue status to completed
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId: job.data.urlId,
          status: 'processing',
        },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      })

      console.log(`Successfully inspected: ${job.data.url}`)
      return { success: true, url: job.data.url }
    } catch (error) {
      console.error(`Error inspecting URL ${job.data.url}:`, error)

      // Update queue status to failed
      await prisma.monitoringQueue.updateMany({
        where: {
          urlId: job.data.urlId,
          status: 'processing',
        },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: {
            increment: 1,
          },
        },
      })

      throw error
    }
  },
  {
    connection,
    concurrency: 10, // Process 10 URLs concurrently
    limiter: {
      max: 600, // 600 requests
      duration: 60000, // per minute (Google API limit)
    },
  }
)

urlInspectionWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed for URL: ${job.data.url}`)
})

urlInspectionWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed for URL: ${job?.data?.url}`, err)
})

urlInspectionWorker.on('error', (err) => {
  console.error('Worker error:', err)
})

console.log('URL Inspection Worker started')

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...')
  await urlInspectionWorker.close()
  await connection.quit()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing worker...')
  await urlInspectionWorker.close()
  await connection.quit()
  process.exit(0)
})
