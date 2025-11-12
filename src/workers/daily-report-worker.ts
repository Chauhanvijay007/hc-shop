import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { QUEUE_NAMES } from '@/lib/queue/types'
import type { ReportJobData } from '@/lib/queue/types'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/client'
import { generateDailyReportEmail } from '@/lib/email/report-templates'
import { subDays, format } from 'date-fns'
import { IndexingState } from '@prisma/client'

export const dailyReportWorker = new Worker<ReportJobData>(
  QUEUE_NAMES.DAILY_REPORT,
  async (job: Job<ReportJobData>) => {
    const { projectId, reportType, recipientEmails } = job.data

    console.log(`📧 [Job ${job.id}] Generating daily report for project ${projectId}`)

    try {
      // Get project details
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      })

      if (!project) {
        throw new Error(`Project ${projectId} not found`)
      }

      // Get current stats
      const totalUrls = await prisma.url.count({
        where: { projectId, isActive: true },
      })

      // Get latest state for each URL
      const latestStates = await prisma.$queryRaw<Array<{
        indexing_state: string
        coverage_state: string
      }>>`
        SELECT DISTINCT ON (url_id)
          indexing_state,
          coverage_state
        FROM indexing_checks
        WHERE url_id IN (
          SELECT id FROM urls WHERE project_id = ${projectId} AND is_active = true
        )
        ORDER BY url_id, checked_at DESC
      `

      const indexed = latestStates.filter(s => s.indexing_state === IndexingState.indexed).length
      const notIndexed = latestStates.filter(s => s.indexing_state === IndexingState.not_indexed).length
      const errors = latestStates.filter(s => s.coverage_state === 'error').length
      const indexedPercentage = totalUrls > 0 ? Math.round((indexed / totalUrls) * 100) : 0

      // Get status changes from last 24 hours
      const yesterday = subDays(new Date(), 1)
      const recentChanges = await prisma.statusChange.findMany({
        where: {
          url: { projectId },
          changedAt: { gte: yesterday },
        },
        include: {
          url: {
            select: { url: true },
          },
        },
        orderBy: { changedAt: 'desc' },
        take: 50,
      })

      // Get new issues (URLs that became not_indexed or got errors)
      const newIssues = recentChanges
        .filter(c => c.newState === IndexingState.not_indexed || c.newState === IndexingState.unknown)
        .map(c => ({
          url: c.url.url,
          error: c.newVerdict || 'Status changed to not indexed',
        }))

      // Generate email
      const emailHtml = generateDailyReportEmail({
        userName: project.user.name || 'there',
        projectName: project.name,
        date: format(new Date(), 'MMMM d, yyyy'),
        stats: {
          totalUrls,
          indexed,
          notIndexed,
          errors,
          indexedPercentage,
        },
        changes: recentChanges.map(c => ({
          url: c.url.url,
          oldState: c.oldState,
          newState: c.newState,
          changedAt: c.changedAt,
        })),
        newIssues,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/dashboard`,
      })

      // Send to all recipients
      const recipients = recipientEmails.length > 0 ? recipientEmails : [project.user.email]

      for (const email of recipients) {
        await sendEmail({
          to: email,
          subject: `Daily Report: ${project.name} - ${format(new Date(), 'MMM d, yyyy')}`,
          html: emailHtml,
        })
      }

      console.log(`✅ [Job ${job.id}] Daily report sent to ${recipients.length} recipient(s)`)

      return {
        success: true,
        recipientCount: recipients.length,
        changesCount: recentChanges.length,
        issuesCount: newIssues.length,
      }
    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Daily report error:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

dailyReportWorker.on('completed', (job, result) => {
  console.log(
    `✅ Daily report ${job.id} completed: ` +
    `${result.recipientCount} recipients, ${result.changesCount} changes`
  )
})

dailyReportWorker.on('failed', (job, err) => {
  console.error(`❌ Daily report ${job?.id} failed:`, err.message)
})

console.log('🚀 Daily Report Worker started')

export default dailyReportWorker
