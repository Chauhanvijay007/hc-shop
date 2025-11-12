import { CronJob } from 'cron'
import { prisma } from '@/lib/db/prisma'
import { weeklyReportQueue } from '@/lib/queue/queues'

/**
 * Weekly report job - runs every Monday at 9 AM UTC
 * Sends weekly email reports to all projects
 */
export const weeklyReportJob = new CronJob(
  '0 9 * * 1', // Every Monday at 9 AM UTC
  async () => {
    console.log('📊 Weekly report job started at', new Date().toISOString())

    try {
      // Get all active projects
      const projects = await prisma.project.findMany({
        select: {
          id: true,
          name: true,
          userId: true,
        },
      })

      console.log(`📋 Generating weekly reports for ${projects.length} projects`)

      for (const project of projects) {
        // Schedule weekly report job for each project
        await weeklyReportQueue.add(
          'weekly-report',
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

        console.log(`✅ Weekly report scheduled for project: ${project.name}`)
      }

      console.log(
        `✅ Weekly report job completed: ${projects.length} reports scheduled`
      )
    } catch (error) {
      console.error('❌ Weekly report job failed:', error)
    }
  },
  null, // onComplete callback
  false, // Don't start automatically
  'UTC' // Timezone
)

/**
 * Start the weekly report scheduler
 */
export function startWeeklyReport() {
  if (!weeklyReportJob.running) {
    weeklyReportJob.start()
    console.log('🚀 Weekly report scheduler started (runs Monday 9 AM UTC)')
  } else {
    console.log('ℹ️  Weekly report scheduler is already running')
  }
}

/**
 * Stop the weekly report scheduler
 */
export function stopWeeklyReport() {
  if (weeklyReportJob.running) {
    weeklyReportJob.stop()
    console.log('🛑 Weekly report scheduler stopped')
  }
}

/**
 * Get next scheduled run time
 */
export function getNextWeeklyReportRun() {
  return weeklyReportJob.nextDate().toJSDate()
}

/**
 * Manually trigger weekly report (for testing)
 */
export async function triggerWeeklyReportNow() {
  console.log('🔧 Manually triggering weekly report...')
  await weeklyReportJob.fireOnTick()
}
