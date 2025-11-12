// Queue job data types for Phase 2

export interface UrlInspectionJobData {
  urlId: string
  projectId: string
  url: string
  siteUrl: string
  userId: string
  priority?: number
}

export interface BulkCheckJobData {
  projectId: string
  userId: string
  urlIds: string[]
  checkType: 'manual' | 'scheduled' | 'initial'
}

export interface AlertCheckJobData {
  projectId: string
  urlId?: string
  changeId: string
}

export interface ReportJobData {
  projectId: string
  reportType: 'daily' | 'weekly'
  recipientEmails: string[]
}

export interface IndexingCheckResult {
  indexingState: string
  coverageState: string
  verdict: string
  lastCrawlTime?: string
  crawlAllowed: boolean
  pageFetchState: string
  robotsTxtState: string
  userCanonical?: string
  googleCanonical?: string
  sitemapDetected?: string
  referringUrl?: string
  mobileUsability?: any
  richResults?: any
  rawApiResponse: any
  errorMessage?: string
}

// Queue names
export const QUEUE_NAMES = {
  URL_INSPECTION: 'url-inspection',
  BULK_CHECK: 'bulk-check',
  ALERT_CHECK: 'alert-check',
  DAILY_REPORT: 'daily-report',
  WEEKLY_REPORT: 'weekly-report',
} as const

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]
