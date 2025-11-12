import { Worker, Job } from 'bullmq'
import { connection } from '@/lib/queue/connection'
import { QUEUE_NAMES } from '@/lib/queue/types'
import type { AlertCheckJobData } from '@/lib/queue/types'
import { prisma } from '@/lib/db/prisma'
import { sendUrlDroppedAlert, sendUrlIndexedAlert, sendErrorDetectedAlert } from '@/lib/email/alerts'
import { IndexingState } from '@prisma/client'

export const alertCheckWorker = new Worker<AlertCheckJobData>(
  QUEUE_NAMES.ALERT_CHECK,
  async (job: Job<AlertCheckJobData>) => {
    const { projectId, urlId, changeId } = job.data

    console.log(`🔔 [Job ${job.id}] Checking alerts for change ${changeId}`)

    try {
      // Get the status change with URL and project details
      const change = await prisma.statusChange.findUnique({
        where: { id: changeId },
        include: {
          url: {
            include: {
              project: {
                include: {
                  user: {
                    select: {
                      email: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!change) {
        throw new Error(`Status change ${changeId} not found`)
      }

      console.log(
        `📊 [Job ${job.id}] Analyzing change: ` +
        `${change.oldState} → ${change.newState} for URL: ${change.url.url}`
      )

      // Get active alert rules for this project
      const alertRules = await prisma.alert.findMany({
        where: {
          projectId,
          isActive: true,
        },
      })

      console.log(`📋 [Job ${job.id}] Found ${alertRules.length} active alert rules`)

      let alertsTriggered = 0

      // Check each alert rule
      for (const rule of alertRules) {
        const shouldTrigger = evaluateAlertRule(rule, change)

        if (shouldTrigger) {
          console.log(`🚨 [Job ${job.id}] Alert triggered: ${rule.alertType}`)

          // Send alert based on type
          if (rule.alertType === 'url_dropped') {
            await sendUrlDroppedAlert({
              email: change.url.project.user.email,
              userName: change.url.project.user.name || 'User',
              projectName: change.url.project.name,
              url: change.url.url,
              previousState: change.oldState,
              newState: change.newState,
              detectedAt: change.changedAt,
              projectId,
            })
          } else if (rule.alertType === 'url_indexed') {
            await sendUrlIndexedAlert({
              email: change.url.project.user.email,
              userName: change.url.project.user.name || 'User',
              projectName: change.url.project.name,
              url: change.url.url,
              previousState: change.oldState,
              detectedAt: change.changedAt,
              projectId,
            })
          } else if (rule.alertType === 'error_detected') {
            await sendErrorDetectedAlert({
              email: change.url.project.user.email,
              userName: change.url.project.user.name || 'User',
              projectName: change.url.project.name,
              url: change.url.url,
              errorMessage: change.newVerdict || 'Indexing error detected',
              detectedAt: change.changedAt,
              projectId,
            })
          }

          // Record alert history
          await prisma.alertHistory.create({
            data: {
              alertId: rule.id,
              urlId: change.urlId,
              triggeredAt: new Date(),
              notificationSent: true,
              alertData: {
                changeId: change.id,
                oldState: change.oldState,
                newState: change.newState,
                oldVerdict: change.oldVerdict,
                newVerdict: change.newVerdict,
              },
            },
          })

          alertsTriggered++
        }
      }

      // Mark change as notified
      await prisma.statusChange.update({
        where: { id: changeId },
        data: { notified: true },
      })

      console.log(
        `✅ [Job ${job.id}] Alert check completed: ${alertsTriggered} alerts triggered`
      )

      return { success: true, alertsTriggered }
    } catch (error: any) {
      console.error(`❌ [Job ${job.id}] Alert check error:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 20, // Process 20 alert checks concurrently
  }
)

/**
 * Evaluate if an alert rule should be triggered
 */
function evaluateAlertRule(rule: any, change: any): boolean {
  switch (rule.alertType) {
    case 'url_dropped':
      // Alert if URL went from indexed to not indexed
      return (
        change.oldState === IndexingState.indexed &&
        change.newState !== IndexingState.indexed
      )

    case 'url_indexed':
      // Alert if URL went from not indexed to indexed
      return (
        change.oldState !== IndexingState.indexed &&
        change.newState === IndexingState.indexed
      )

    case 'error_detected':
      // Alert if new state is not_indexed with error message
      return (
        change.newState === IndexingState.not_indexed &&
        change.newVerdict !== null &&
        change.newVerdict !== ''
      )

    case 'bulk_drop':
      // This would be handled separately in a bulk analysis job
      return false

    case 'not_indexed_duration':
      // This requires checking duration, would need additional logic
      return false

    case 'specific_error':
      // Check if verdict matches specific error condition
      if (rule.triggerCondition?.errorPattern) {
        return change.newVerdict?.includes(rule.triggerCondition.errorPattern)
      }
      return false

    default:
      console.warn(`Unknown alert type: ${rule.alertType}`)
      return false
  }
}

// Worker event handlers
alertCheckWorker.on('completed', (job, result) => {
  console.log(
    `✅ Alert check ${job.id} completed: ${result.alertsTriggered} alerts triggered`
  )
})

alertCheckWorker.on('failed', (job, err) => {
  console.error(`❌ Alert check ${job?.id} failed:`, err.message)
})

alertCheckWorker.on('error', (err) => {
  console.error('🚨 Alert check worker error:', err)
})

console.log('🚀 Alert Check Worker started')

export default alertCheckWorker
