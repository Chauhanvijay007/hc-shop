import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { subDays, format, startOfDay } from 'date-fns'
import { IndexingState } from '@prisma/client'

// GET /api/projects/:id/trends - Get indexing trends data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = params.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const granularity = searchParams.get('granularity') || 'daily' // daily or weekly

    // Calculate date range
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Get all URLs for this project
    const urls = await prisma.url.findMany({
      where: {
        projectId,
        isActive: true,
      },
      select: { id: true },
    })

    const urlIds = urls.map(u => u.id)

    if (urlIds.length === 0) {
      return NextResponse.json({
        trends: [],
        summary: {
          totalUrls: 0,
          indexed: 0,
          notIndexed: 0,
          discovered: 0,
          errors: 0,
        },
      })
    }

    // Get indexing checks within the date range
    const checks = await prisma.indexingCheck.findMany({
      where: {
        urlId: { in: urlIds },
        checkedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        urlId: true,
        checkedAt: true,
        indexingState: true,
        coverageState: true,
      },
      orderBy: {
        checkedAt: 'asc',
      },
    })

    // Group checks by date
    const trendMap = new Map<string, {
      date: string
      indexed: number
      notIndexed: number
      discovered: number
      unknown: number
      errors: number
    }>()

    // Initialize all dates in range
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.setDate(d.getDate() + 1))) {
      const dateKey = format(d, 'yyyy-MM-dd')
      trendMap.set(dateKey, {
        date: dateKey,
        indexed: 0,
        notIndexed: 0,
        discovered: 0,
        unknown: 0,
        errors: 0,
      })
    }

    // Count states for each date (take the latest check per URL per day)
    const latestCheckPerUrlPerDay = new Map<string, Map<string, any>>()

    for (const check of checks) {
      const dateKey = format(startOfDay(check.checkedAt), 'yyyy-MM-dd')
      const urlKey = check.urlId

      if (!latestCheckPerUrlPerDay.has(dateKey)) {
        latestCheckPerUrlPerDay.set(dateKey, new Map())
      }

      const dayChecks = latestCheckPerUrlPerDay.get(dateKey)!

      // Keep only the latest check for each URL on this day
      const existing = dayChecks.get(urlKey)
      if (!existing || check.checkedAt > existing.checkedAt) {
        dayChecks.set(urlKey, check)
      }
    }

    // Aggregate counts
    for (const [dateKey, urlChecks] of latestCheckPerUrlPerDay.entries()) {
      if (!trendMap.has(dateKey)) continue

      const trend = trendMap.get(dateKey)!

      for (const check of urlChecks.values()) {
        switch (check.indexingState) {
          case IndexingState.indexed:
            trend.indexed++
            break
          case IndexingState.not_indexed:
            trend.notIndexed++
            break
          case IndexingState.discovered:
            trend.discovered++
            break
          default:
            trend.unknown++
        }

        if (check.coverageState === 'error') {
          trend.errors++
        }
      }
    }

    // Convert map to sorted array
    const trends = Array.from(trendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    // Calculate current summary (latest state)
    const latestChecks = await prisma.$queryRaw<Array<{
      indexing_state: string
      coverage_state: string
      count: bigint
    }>>`
      SELECT DISTINCT ON (url_id)
        indexing_state,
        coverage_state,
        COUNT(*) OVER () as count
      FROM indexing_checks
      WHERE url_id = ANY(${urlIds}::text[])
      ORDER BY url_id, checked_at DESC
    `

    const summary = {
      totalUrls: urlIds.length,
      indexed: 0,
      notIndexed: 0,
      discovered: 0,
      errors: 0,
    }

    for (const check of latestChecks) {
      switch (check.indexing_state) {
        case IndexingState.indexed:
          summary.indexed++
          break
        case IndexingState.not_indexed:
          summary.notIndexed++
          break
        case IndexingState.discovered:
          summary.discovered++
          break
      }

      if (check.coverage_state === 'error') {
        summary.errors++
      }
    }

    return NextResponse.json({
      trends,
      summary,
      dateRange: {
        from: format(startDate, 'yyyy-MM-dd'),
        to: format(endDate, 'yyyy-MM-dd'),
        days,
      },
    })
  } catch (error: any) {
    console.error('Error fetching trends:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
