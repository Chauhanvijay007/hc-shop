import { CronJob } from 'cron'
import { prisma } from '@/lib/db/prisma'
import { addBulkCheckJob } from '@/lib/queue/queues'

/**
 * Daily monitoring job - runs every day at 2 AM UTC
 * Checks all URLs with 'daily' monitoring frequency
 */
export const dailyMonitorJob = new CronJob(
  '0 2 * * *', // Every day at 2 AM UTC
  async () => {
    console.log('⏰ Daily monitoring job started at', new Date().toISOString())

    try {
      // Get all active projects
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
        },
      })

      console.log(`📋 Found ${projects.length} projects to monitor`)

      let totalUrlsScheduled = 0

      for (const project of projects) {
        // Get URLs that need daily monitoring
        const urls = await prisma.url.findMany({
          where: {
            projectId: project.id,
            isActive: true,
            monitoringFrequency: 'daily',
          },
          select: {
            id: true,
          },
        })

        if (urls.length === 0) {
          console.log(`ℹ️  No daily URLs to monitor for project: ${project.name}`)
          continue
        }

        console.log(`📦 Scheduling ${urls.length} URLs for project: ${project.name}`)

        // Schedule bulk check
        await addBulkCheckJob({
          projectId: project.id,
          userId: project.userId,
          urlIds: urls.map(u => u.id),
          checkType: 'scheduled',
        })

        totalUrlsScheduled += urls.length
      }

      console.log(
        `✅ Daily monitoring job completed: ` +
        `${projects.length} projects, ${totalUrlsScheduled} URLs scheduled`
      )
    } catch (error) {
      console.error('❌ Daily monitoring job failed:', error)
    }
  },
  null, // onComplete callback
  false, // Don't start automatically
  'UTC' // Timezone
)

/**
 * Start the daily monitoring scheduler
 */
export function startDailyMonitor() {
  if (!dailyMonitorJob.running) {
    dailyMonitorJob.start()
    console.log('🚀 Daily monitoring scheduler started (runs at 2 AM UTC)')
  } else {
    console.log('ℹ️  Daily monitoring scheduler is already running')
  }
}

/**
 * Stop the daily monitoring scheduler
 */
export function stopDailyMonitor() {
  if (dailyMonitorJob.running) {
    dailyMonitorJob.stop()
    console.log('🛑 Daily monitoring scheduler stopped')
  }
}

/**
 * Get next scheduled run time
 */
export function getNextDailyRun() {
  return dailyMonitorJob.nextDate().toJSDate()
}

/**
 * Manually trigger daily monitoring (for testing)
 */
export async function triggerDailyMonitorNow() {
  console.log('🔧 Manually triggering daily monitoring...')
  await dailyMonitorJob.fireOnTick()
}
