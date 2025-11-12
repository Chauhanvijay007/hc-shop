import { Queue } from 'bullmq'
import { connection } from './connection'
import {
  QUEUE_NAMES,
  UrlInspectionJobData,
  BulkCheckJobData,
  AlertCheckJobData,
  ReportJobData,
} from './types'

// URL Inspection Queue - for individual URL checks
export const urlInspectionQueue = new Queue<UrlInspectionJobData>(
  QUEUE_NAMES.URL_INSPECTION,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Start with 5 seconds
      },
      removeOnComplete: {
        count: 100, // Keep last 100 completed jobs
        age: 24 * 3600, // Keep for 24 hours
      },
      removeOnFail: {
        count: 500, // Keep last 500 failed jobs for debugging
        age: 7 * 24 * 3600, // Keep for 7 days
      },
    },
  }
)

// Bulk Check Queue - for scheduling multiple URLs
export const bulkCheckQueue = new Queue<BulkCheckJobData>(
  QUEUE_NAMES.BULK_CHECK,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10000,
      },
      removeOnComplete: {
        count: 50,
        age: 24 * 3600,
      },
    },
  }
)

// Alert Check Queue - for checking alert conditions
export const alertCheckQueue = new Queue<AlertCheckJobData>(
  QUEUE_NAMES.ALERT_CHECK,
  {
    connection,
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
      removeOnComplete: {
        count: 200,
        age: 48 * 3600, // Keep for 48 hours
      },
    },
  }
)

// Daily Report Queue
export const dailyReportQueue = new Queue<ReportJobData>(
  QUEUE_NAMES.DAILY_REPORT,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
    },
  }
)

// Weekly Report Queue
export const weeklyReportQueue = new Queue<ReportJobData>(
  QUEUE_NAMES.WEEKLY_REPORT,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 30000,
      },
    },
  }
)

// Helper function to add URL inspection job
export async function addUrlInspectionJob(data: UrlInspectionJobData) {
  return urlInspectionQueue.add('inspect-url', data, {
    priority: data.priority || 10,
    jobId: `url-${data.urlId}-${Date.now()}`, // Unique job ID
  })
}

// Helper function to add bulk check job
export async function addBulkCheckJob(data: BulkCheckJobData) {
  return bulkCheckQueue.add('bulk-check', data, {
    jobId: `bulk-${data.projectId}-${Date.now()}`,
  })
}

// Helper function to add alert check job
export async function addAlertCheckJob(data: AlertCheckJobData) {
  return alertCheckQueue.add('alert-check', data, {
    jobId: `alert-${data.changeId}-${Date.now()}`,
  })
}

// Helper function to add daily report job
export async function addDailyReportJob(data: ReportJobData) {
  return dailyReportQueue.add('daily-report', data, {
    jobId: `daily-${data.projectId}-${Date.now()}`,
  })
}

// Helper function to add weekly report job
export async function addWeeklyReportJob(data: ReportJobData) {
  return weeklyReportQueue.add('weekly-report', data, {
    jobId: `weekly-${data.projectId}-${Date.now()}`,
  })
}

// Get queue statistics
export async function getQueueStats(queueName: string) {
  let queue: Queue

  switch (queueName) {
    case QUEUE_NAMES.URL_INSPECTION:
      queue = urlInspectionQueue
      break
    case QUEUE_NAMES.BULK_CHECK:
      queue = bulkCheckQueue
      break
    case QUEUE_NAMES.ALERT_CHECK:
      queue = alertCheckQueue
      break
    case QUEUE_NAMES.DAILY_REPORT:
      queue = dailyReportQueue
      break
    case QUEUE_NAMES.WEEKLY_REPORT:
      queue = weeklyReportQueue
      break
    default:
      throw new Error(`Unknown queue: ${queueName}`)
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    total: waiting + active,
  }
}
