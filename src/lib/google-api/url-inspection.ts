import { google } from 'googleapis'
import { prisma } from '@/lib/db/prisma'
import { GoogleInspectionResult } from '@/types'
import { IndexingState, CoverageState } from '@prisma/client'

export class GoogleURLInspection {
  private async getAccessToken(userId: string): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('No Google OAuth token found')
    }

    // Check if token is expired and refresh if needed
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      if (!account.refresh_token) {
        throw new Error('No refresh token available')
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )

      oauth2Client.setCredentials({
        refresh_token: account.refresh_token,
      })

      const { credentials } = await oauth2Client.refreshAccessToken()

      // Update the access token in database
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
        },
      })

      return credentials.access_token!
    }

    return account.access_token
  }

  async inspectUrl(userId: string, siteUrl: string, inspectionUrl: string): Promise<GoogleInspectionResult> {
    const accessToken = await this.getAccessToken(userId)

    const response = await fetch(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionUrl,
          siteUrl,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Google API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data: GoogleInspectionResult = await response.json()
    return data
  }

  parseIndexingState(verdict?: string): IndexingState {
    if (!verdict) return IndexingState.unknown

    const v = verdict.toLowerCase()
    if (v.includes('pass') || v === 'valid') return IndexingState.indexed
    if (v.includes('fail') || v.includes('error')) return IndexingState.not_indexed
    if (v.includes('neutral') || v.includes('discover')) return IndexingState.discovered
    return IndexingState.unknown
  }

  parseCoverageState(coverageState?: string): CoverageState {
    if (!coverageState) return CoverageState.unknown

    const cs = coverageState.toLowerCase()
    if (cs.includes('valid')) return CoverageState.valid
    if (cs.includes('excluded')) return CoverageState.excluded
    if (cs.includes('error')) return CoverageState.error
    return CoverageState.unknown
  }

  async inspectAndStore(
    userId: string,
    urlId: string,
    siteUrl: string,
    inspectionUrl: string
  ) {
    try {
      const result = await this.inspectUrl(userId, siteUrl, inspectionUrl)

      const indexStatusResult = result.inspectionResult?.indexStatusResult
      const mobileUsability = result.inspectionResult?.mobileUsabilityResult
      const richResults = result.inspectionResult?.richResultsResult

      // Determine indexing state
      const indexingState = this.parseIndexingState(indexStatusResult?.verdict)
      const coverageState = this.parseCoverageState(indexStatusResult?.coverageState)

      // Get the latest check to detect changes
      const latestCheck = await prisma.indexingCheck.findFirst({
        where: { urlId },
        orderBy: { checkedAt: 'desc' },
      })

      // Create new check record
      const newCheck = await prisma.indexingCheck.create({
        data: {
          urlId,
          checkedAt: new Date(),
          indexingState,
          coverageState,
          verdict: indexStatusResult?.verdict,
          lastCrawlTime: indexStatusResult?.lastCrawlTime ? new Date(indexStatusResult.lastCrawlTime) : null,
          crawlAllowed: indexStatusResult?.robotsTxtState === 'ALLOWED',
          pageFetchState: indexStatusResult?.pageFetchState,
          robotsTxtState: indexStatusResult?.robotsTxtState,
          userCanonical: indexStatusResult?.userCanonical,
          googleCanonical: indexStatusResult?.googleCanonical,
          sitemapDetected: indexStatusResult?.sitemap?.join(', '),
          referringUrl: indexStatusResult?.referringUrls?.join(', '),
          mobileUsability: mobileUsability?.verdict,
          richResults: richResults as any,
          rawApiResponse: result as any,
          errorMessage: indexingState === IndexingState.not_indexed ? indexStatusResult?.verdict : null,
        },
      })

      // Detect status change
      if (latestCheck && latestCheck.indexingState !== indexingState) {
        await prisma.statusChange.create({
          data: {
            urlId,
            changedAt: new Date(),
            oldState: latestCheck.indexingState,
            newState: indexingState,
            oldVerdict: latestCheck.verdict,
            newVerdict: indexStatusResult?.verdict,
            notified: false,
          },
        })
      }

      return newCheck
    } catch (error) {
      console.error('Error inspecting URL:', error)
      throw error
    }
  }
}

export const googleURLInspection = new GoogleURLInspection()
