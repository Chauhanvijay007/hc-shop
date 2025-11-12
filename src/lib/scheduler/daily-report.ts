import { CronJob } from 'cron'
import { prisma } from '@/lib/db/prisma'
import { dailyReportQueue } from '@/lib/queue/queues'

/**
 * Daily report job - runs every day at 8 AM UTC
 * Sends daily email reports to all projects
 */
export const dailyReportJob = new CronJob(
  '0 8 * * *', // Every day at 8 AM UTC
  async () => {
    console.log('📊 Daily report job started at', new Date().toISOString())

    try {
      // Get all active projects
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
        },
      })

      console.log(`📋 Generating daily reports for ${projects.length} projects`)

      for (const project of projects) {
        // Schedule daily report job for each project
        await dailyReportQueue.add(
          'daily-report',
          {
            projectId: project.id,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }
        )

        console.log(`✅ Daily report scheduled for project: ${project.name}`)
      }

      console.log(
        `✅ Daily report job completed: ${projects.length} reports scheduled`
      )
    } catch (error) {
      console.error('❌ Daily report job failed:', error)
    }
  },
  null, // onComplete callback
  false, // Don't start automatically
  'UTC' // Timezone
)

/**
 * Start the daily report scheduler
 */
export function startDailyReport() {
  if (!dailyReportJob.running) {
    dailyReportJob.start()
    console.log('🚀 Daily report scheduler started (runs at 8 AM UTC)')
  } else {
    console.log('ℹ️  Daily report scheduler is already running')
  }
}

/**
 * Stop the daily report scheduler
 */
export function stopDailyReport() {
  if (dailyReportJob.running) {
    dailyReportJob.stop()
    console.log('🛑 Daily report scheduler stopped')
  }
}

/**
 * Get next scheduled run time
 */
export function getNextDailyReportRun() {
  return dailyReportJob.nextDate().toJSDate()
}

/**
 * Manually trigger daily report (for testing)
 */
export async function triggerDailyReportNow() {
  console.log('🔧 Manually triggering daily report...')
  await dailyReportJob.fireOnTick()
}
