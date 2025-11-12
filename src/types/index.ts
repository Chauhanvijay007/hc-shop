import { IndexingState, CoverageState, Priority, MonitoringFrequency, AlertType } from '@prisma/client'

export type { IndexingState, CoverageState, Priority, MonitoringFrequency, AlertType }

export interface DashboardStats {
  totalUrls: number
  indexedUrls: number
  notIndexedUrls: number
  urlsWithErrors: number
  change24h: number
  change7d: number
}

export interface TrendData {
  date: string
  indexed: number
  notIndexed: number
  discovered: number
  errors: number
}

export interface UrlWithChecks {
  id: string
  url: string
  priority: Priority
  tags: string[]
  groups: string[]
  isActive: boolean
  createdAt: Date
  latestCheck?: {
    indexingState: IndexingState
    coverageState: CoverageState
    verdict?: string
    checkedAt: Date
    errorMessage?: string
  }
}

export interface FilterOptions {
  indexingState?: IndexingState[]
  coverageState?: CoverageState[]
  priority?: Priority[]
  tags?: string[]
  groups?: string[]
  urlPattern?: string
  hasErrors?: boolean
  statusChanged?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export interface GoogleInspectionResult {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string
      coverageState?: string
      robotsTxtState?: string
      indexingState?: string
      lastCrawlTime?: string
      pageFetchState?: string
      googleCanonical?: string
      userCanonical?: string
      sitemap?: string[]
      referringUrls?: string[]
    }
    mobileUsabilityResult?: {
      verdict?: string
      issues?: Array<{
        issueType?: string
        severity?: string
        message?: string
      }>
    }
    richResultsResult?: {
      verdict?: string
      detectedItems?: Array<{
        richResultType?: string
        items?: Array<{
          name?: string
        }>
      }>
    }
  }
}
