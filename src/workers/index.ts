/**
 * Worker Manager - Phase 2 & 3
 * Starts all background workers and schedulers
 */

import urlInspectionWorker from './url-inspection-worker'
import bulkCheckWorker from './bulk-check-worker'
import alertCheckWorker from './alert-check-worker'
import dailyReportWorker from './daily-report-worker'
import weeklyReportWorker from './weekly-report-worker'
import { startDailyMonitor, stopDailyMonitor, getNextDailyRun } from '@/lib/scheduler/daily-monitor'
import { startWeeklyMonitor, stopWeeklyMonitor, getNextWeeklyRun } from '@/lib/scheduler/weekly-monitor'
import { startDailyReport, stopDailyReport, getNextDailyReportRun } from '@/lib/scheduler/daily-report'
import { startWeeklyReport, stopWeeklyReport, getNextWeeklyReportRun } from '@/lib/scheduler/weekly-report'
import { connection } from '@/lib/queue/connection'

console.log('🚀 Starting Indexing Insight Workers...')
console.log('=====================================')

// List all workers
const workers = [
  { name: 'URL Inspection Worker', instance: urlInspectionWorker },
  { name: 'Bulk Check Worker', instance: bulkCheckWorker },
  { name: 'Alert Check Worker', instance: alertCheckWorker },
  { name: 'Daily Report Worker', instance: dailyReportWorker },
  { name: 'Weekly Report Worker', instance: weeklyReportWorker },
]

console.log(`\n✅ ${workers.length} workers started:`)
workers.forEach(w => console.log(`   - ${w.name}`))

// Start schedulers
console.log('\n📅 Starting schedulers...')
startDailyMonitor()
startWeeklyMonitor()
startDailyReport()
startWeeklyReport()

// Log next scheduled runs
const nextDaily = getNextDailyRun()
const nextWeekly = getNextWeeklyRun()
const nextDailyReport = getNextDailyReportRun()
const nextWeeklyReport = getNextWeeklyReportRun()
console.log(`   - Daily monitoring: next run at ${nextDaily.toLocaleString()}`)
console.log(`   - Weekly monitoring: next run at ${nextWeekly.toLocaleString()}`)
console.log(`   - Daily report: next run at ${nextDailyReport.toLocaleString()}`)
console.log(`   - Weekly report: next run at ${nextWeeklyReport.toLocaleString()}`)

console.log('\n✅ All workers and schedulers are running!')
console.log('=====================================')

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`)

  // Stop schedulers
  console.log('🛑 Stopping schedulers...')
  stopDailyMonitor()
  stopWeeklyMonitor()
  stopDailyReport()
  stopWeeklyReport()

  // Close all workers
  console.log('🛑 Closing workers...')
  await Promise.all(workers.map(w => w.instance.close()))

  // Close Redis connection
  console.log('🛑 Closing Redis connection...')
  await connection.quit()

  console.log('✅ Shutdown complete')
  process.exit(0)
}

// Handle process signals
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error)
  shutdown('UNCAUGHT_EXCEPTION')
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason)
})

// Keep process alive
process.stdin.resume()
