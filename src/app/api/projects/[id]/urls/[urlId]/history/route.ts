import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/projects/:id/urls/:urlId/history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership and URL belongs to project
    const url = await prisma.url.findFirst({
      where: {
        id: params.urlId,
        projectId: params.id,
        project: { userId: session.user.id },
      },
      include: {
        project: { select: { name: true, domain: true } },
      },
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    const since = new Date()
    since.setDate(since.getDate() - days)

    // Get full check history
    const checks = await prisma.indexingCheck.findMany({
      where: {
        urlId: params.urlId,
        checkedAt: { gte: since },
      },
      orderBy: { checkedAt: 'desc' },
      select: {
        id: true,
        checkedAt: true,
        indexingState: true,
        coverageState: true,
        verdict: true,
        lastCrawlTime: true,
        crawlAllowed: true,
        pageFetchState: true,
        robotsTxtState: true,
        userCanonical: true,
        googleCanonical: true,
        mobileUsability: true,
        richResults: true,
        errorMessage: true,
      },
    })

    // Get status change history
    const statusChanges = await prisma.statusChange.findMany({
      where: {
        urlId: params.urlId,
        changedAt: { gte: since },
      },
      orderBy: { changedAt: 'desc' },
      select: {
        id: true,
        changedAt: true,
        oldState: true,
        newState: true,
        oldVerdict: true,
        newVerdict: true,
      },
    })

    // Latest check for metadata display
    const latestCheck = checks[0] || null

    return NextResponse.json({
      url: {
        id: url.id,
        url: url.url,
        priority: url.priority,
        tags: url.tags,
        groups: url.groups,
        createdAt: url.createdAt,
        lastCheckedAt: url.lastCheckedAt,
        project: url.project,
      },
      latestCheck,
      checks,
      statusChanges,
      totalChecks: checks.length,
    })
  } catch (error) {
    console.error('Error fetching URL history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
