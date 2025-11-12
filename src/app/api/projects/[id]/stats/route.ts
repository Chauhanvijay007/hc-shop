import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { IndexingState } from '@prisma/client'
import { subDays } from 'date-fns'

// GET /api/projects/:id/stats - Get dashboard statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get all URLs for this project
    const totalUrls = await prisma.url.count({
      where: { projectId: params.id, isActive: true },
    })

    // Get latest check for each URL to calculate current stats
    const urlsWithLatestCheck = await prisma.$queryRaw<Array<{
      url_id: string
      indexing_state: string
      coverage_state: string
      checked_at: Date
    }>>`
      SELECT DISTINCT ON (url_id)
        url_id,
        indexing_state,
        coverage_state,
        checked_at
      FROM indexing_checks
      WHERE url_id IN (
        SELECT id FROM urls WHERE project_id = ${params.id} AND is_active = true
      )
      ORDER BY url_id, checked_at DESC
    `

    const indexed = urlsWithLatestCheck.filter(c => c.indexing_state === IndexingState.indexed).length
    const notIndexed = urlsWithLatestCheck.filter(c => c.indexing_state === IndexingState.not_indexed).length
    const withErrors = urlsWithLatestCheck.filter(c => c.coverage_state === 'error').length

    // Calculate changes
    const now = new Date()
    const yesterday = subDays(now, 1)
    const weekAgo = subDays(now, 7)

    const statusChanges24h = await prisma.statusChange.count({
      where: {
        url: { projectId: params.id },
        changedAt: { gte: yesterday },
        newState: IndexingState.indexed,
      },
    })

    const statusChanges7d = await prisma.statusChange.count({
      where: {
        url: { projectId: params.id },
        changedAt: { gte: weekAgo },
        newState: IndexingState.indexed,
      },
    })

    const stats = {
      totalUrls,
      indexedUrls: indexed,
      notIndexedUrls: notIndexed,
      urlsWithErrors: withErrors,
      change24h: statusChanges24h,
      change7d: statusChanges7d,
      indexedPercentage: totalUrls > 0 ? Math.round((indexed / totalUrls) * 100) : 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
