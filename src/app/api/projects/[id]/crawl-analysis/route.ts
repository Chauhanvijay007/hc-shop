import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/projects/:id/crawl-analysis
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get all active URLs with their latest indexing check
    const urlsWithChecks = await prisma.$queryRaw<Array<{
      url_id: string
      url: string
      priority: string
      tags: string[]
      last_crawl_time: Date | null
      checked_at: Date | null
      indexing_state: string | null
      coverage_state: string | null
      crawl_allowed: boolean | null
      robots_txt_state: string | null
      page_fetch_state: string | null
    }>>`
      SELECT
        u.id as url_id,
        u.url,
        u.priority,
        u.tags,
        ic.last_crawl_time,
        ic.checked_at,
        ic.indexing_state,
        ic.coverage_state,
        ic.crawl_allowed,
        ic.robots_txt_state,
        ic.page_fetch_state
      FROM urls u
      LEFT JOIN LATERAL (
        SELECT last_crawl_time, checked_at, indexing_state, coverage_state,
               crawl_allowed, robots_txt_state, page_fetch_state
        FROM indexing_checks
        WHERE url_id = u.id
        ORDER BY checked_at DESC
        LIMIT 1
      ) ic ON true
      WHERE u.project_id = ${params.id}
        AND u.is_active = true
      ORDER BY u.created_at DESC
    `

    const totalUrls = urlsWithChecks.length
    const neverChecked = urlsWithChecks.filter(u => !u.checked_at)
    const neverCrawled = urlsWithChecks.filter(u => u.checked_at && !u.last_crawl_time)
    const crawled = urlsWithChecks.filter(u => u.last_crawl_time)

    // Wasted crawl budget: crawled but not indexed
    const crawledButNotIndexed = crawled.filter(
      u => u.indexing_state && u.indexing_state !== 'indexed'
    )

    // Blocked by robots
    const blockedByRobots = urlsWithChecks.filter(
      u => u.robots_txt_state === 'BLOCKED_BY_ROBOTS_TXT' || u.crawl_allowed === false
    )

    // Crawl frequency - count checks per URL in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const crawlFrequency = await prisma.$queryRaw<Array<{
      url_id: string
      check_count: bigint
    }>>`
      SELECT url_id, COUNT(*) as check_count
      FROM indexing_checks
      WHERE url_id IN (
        SELECT id FROM urls WHERE project_id = ${params.id} AND is_active = true
      )
      AND checked_at >= ${thirtyDaysAgo}
      GROUP BY url_id
    `

    const freqMap = new Map(crawlFrequency.map(f => [f.url_id, Number(f.check_count)]))

    // Build per-URL crawl data
    const urlCrawlData = urlsWithChecks.map(u => ({
      urlId: u.url_id,
      url: u.url,
      priority: u.priority,
      lastCrawlTime: u.last_crawl_time,
      lastCheckedAt: u.checked_at,
      indexingState: u.indexing_state,
      coverageState: u.coverage_state,
      crawlAllowed: u.crawl_allowed,
      robotsTxtState: u.robots_txt_state,
      pageFetchState: u.page_fetch_state,
      checksLast30Days: freqMap.get(u.url_id) || 0,
    }))

    // Summary stats
    const summary = {
      totalUrls,
      neverChecked: neverChecked.length,
      neverCrawled: neverCrawled.length,
      crawled: crawled.length,
      crawledButNotIndexed: crawledButNotIndexed.length,
      blockedByRobots: blockedByRobots.length,
      crawlCoverage: totalUrls > 0 ? Math.round((crawled.length / totalUrls) * 100) : 0,
      crawlEfficiency: crawled.length > 0
        ? Math.round(((crawled.length - crawledButNotIndexed.length) / crawled.length) * 100)
        : 0,
    }

    return NextResponse.json({
      summary,
      urls: urlCrawlData,
    })
  } catch (error) {
    console.error('Error fetching crawl analysis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
