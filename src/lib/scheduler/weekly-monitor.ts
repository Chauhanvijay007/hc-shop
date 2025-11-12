import { CronJob } from 'cron'
import { prisma } from '@/lib/db/prisma'
import { addBulkCheckJob } from '@/lib/queue/queues'

/**
 * Weekly monitoring job - runs every Sunday at 3 AM UTC
 * Checks all URLs with 'weekly' monitoring frequency
 */
export const weeklyMonitorJob = new CronJob(
  '0 3 * * 0', // Every Sunday at 3 AM UTC
  async () => {
    console.log('⏰ Weekly monitoring job started at', new Date().toISOString())

    try {
      // Get all active projects
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
        },
      })

      console.log(`📋 Found ${projects.length} projects for weekly monitoring`)

      let totalUrlsScheduled = 0

      for (const project of projects) {
        // Get URLs that need weekly monitoring
        const urls = await prisma.url.findMany({
          where: {
            projectId: project.id,
            isActive: true,
            monitoringFrequency: 'weekly',
          },
          select: {
            id: true,
          },
        })

        if (urls.length === 0) {
          console.log(`ℹ️  No weekly URLs to monitor for project: ${project.name}`)
          continue
        }

        console.log(`📦 Scheduling ${urls.length} weekly URLs for project: ${project.name}`)

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
        `✅ Weekly monitoring job completed: ` +
        `${projects.length} projects, ${totalUrlsScheduled} URLs scheduled`
      )
    } catch (error) {
      console.error('❌ Weekly monitoring job failed:', error)
    }
  },
  null,
  false,
  'UTC'
)

/**
 * Start the weekly monitoring scheduler
 */
export function startWeeklyMonitor() {
  if (!weeklyMonitorJob.running) {
    weeklyMonitorJob.start()
    console.log('🚀 Weekly monitoring scheduler started (runs Sundays at 3 AM UTC)')
  } else {
    console.log('ℹ️  Weekly monitoring scheduler is already running')
  }
}

/**
 * Stop the weekly monitoring scheduler
 */
export function stopWeeklyMonitor() {
  if (weeklyMonitorJob.running) {
    weeklyMonitorJob.stop()
    console.log('🛑 Weekly monitoring scheduler stopped')
  }
}

/**
 * Get next scheduled run time
 */
export function getNextWeeklyRun() {
  return weeklyMonitorJob.nextDate().toJSDate()
}

/**
 * Manually trigger weekly monitoring (for testing)
 */
export async function triggerWeeklyMonitorNow() {
  console.log('🔧 Manually triggering weekly monitoring...')
  await weeklyMonitorJob.fireOnTick()
}
