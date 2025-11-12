import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { QUEUE_NAMES } from '@/lib/queue/types'
import type { ReportJobData } from '@/lib/queue/types'
import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/client'
import { generateWeeklyReportEmail } from '@/lib/email/report-templates'
import { subDays, format, startOfWeek, endOfWeek } from 'date-fns'
import { IndexingState } from '@prisma/client'

export const weeklyReportWorker = new Worker<ReportJobData>(
  QUEUE_NAMES.WEEKLY_REPORT,
  async (job: Job<ReportJobData>) => {
    const { projectId, reportType, recipientEmails } = job.data

    console.log(`📧 [Job ${job.id}] Generating weekly report for project ${projectId}`)

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

      // Date ranges
      const now = new Date()
      const weekStart = startOfWeek(now)
      const weekEnd = endOfWeek(now)
      const sevenDaysAgo = subDays(now, 7)

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

      // Get status changes from last 7 days
      const weeklyChanges = await prisma.statusChange.findMany({
        where: {
          url: { projectId },
          changedAt: { gte: sevenDaysAgo },
        },
        include: {
          url: {
            select: { url: true },
          },
        },
        orderBy: { changedAt: 'desc' },
      })

      // Count improvements and degradations
      const improvements = weeklyChanges.filter(c =>
        c.oldState !== IndexingState.indexed && c.newState === IndexingState.indexed
      ).length

      const degradations = weeklyChanges.filter(c =>
        c.oldState === IndexingState.indexed && c.newState !== IndexingState.indexed
      ).length

      // Get top issues (group by error message)
      const recentIssues = await prisma.indexingCheck.findMany({
        where: {
          url: { projectId, isActive: true },
          checkedAt: { gte: sevenDaysAgo },
          indexingState: IndexingState.not_indexed,
          errorMessage: { not: null },
        },
        select: {
          errorMessage: true,
        },
      })

      const issueMap = new Map<string, number>()
      for (const issue of recentIssues) {
        if (issue.errorMessage) {
          const count = issueMap.get(issue.errorMessage) || 0
          issueMap.set(issue.errorMessage, count + 1)
        }
      }

      const topIssues = Array.from(issueMap.entries())
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get new issues
      const newIssues = weeklyChanges
        .filter(c => c.newState === IndexingState.not_indexed)
        .map(c => ({
          url: c.url.url,
          error: c.newVerdict || 'Not indexed',
        }))

      // Generate email
      const weekRange = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`

      const emailHtml = generateWeeklyReportEmail({
        userName: project.user.name || 'there',
        projectName: project.name,
        date: format(now, 'MMMM d, yyyy'),
        weekRange,
        stats: {
          totalUrls,
          indexed,
          notIndexed,
          errors,
          indexedPercentage,
        },
        changes: weeklyChanges.map(c => ({
          url: c.url.url,
          oldState: c.oldState,
          newState: c.newState,
          changedAt: c.changedAt,
        })),
        newIssues,
        topIssues,
        improvements,
        degradations,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/projects/${projectId}/dashboard`,
      })

      // Send to all recipients
      const recipients = recipientEmails.length > 0 ? recipientEmails : [project.user.email]

      for (const email of recipients) {
        await sendEmail({
          to: email,
          subject: `Weekly Report: ${project.name} - Week of ${format(weekStart, 'MMM d')}`,
          html: emailHtml,
        })
      }

      console.log(`✅ [Job ${job.id}] Weekly report sent to ${recipients.length} recipient(s)`)

      return {
        success: true,
        recipientCount: recipients.length,
        changesCount: weeklyChanges.length,
        improvements,
        degradations,
      }
    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Weekly report error:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 3,
  }
)

weeklyReportWorker.on('completed', (job, result) => {
  console.log(
    `✅ Weekly report ${job.id} completed: ` +
    `${result.recipientCount} recipients, ` +
    `+${result.improvements} improvements, -${result.degradations} degradations`
  )
})

weeklyReportWorker.on('failed', (job, err) => {
  console.error(`❌ Weekly report ${job?.id} failed:`, err.message)
})

console.log('🚀 Weekly Report Worker started')

export default weeklyReportWorker
