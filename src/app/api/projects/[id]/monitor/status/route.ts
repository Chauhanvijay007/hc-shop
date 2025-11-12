import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getQueueStats } from '@/lib/queue/queues'
import { QUEUE_NAMES } from '@/lib/queue/types'

// GET /api/projects/:id/monitor/status - Get monitoring status
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

    // Get queue statistics
    const queueStats = await getQueueStats(QUEUE_NAMES.URL_INSPECTION)

    // Get project-specific monitoring status
    const urlStatuses = await prisma.monitoringQueue.groupBy({
      by: ['status'],
      where: {
        url: {
          projectId,
        },
      },
      _count: true,
    })

    const statusBreakdown: Record<string, number> = {}
    urlStatuses.forEach(s => {
      statusBreakdown[s.status] = s._count
    })

    // Get recent activity (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentChecks = await prisma.indexingCheck.count({
      where: {
        url: {
          projectId,
        },
        checkedAt: {
          gte: last24h,
        },
      },
    })

    return NextResponse.json({
      queue: queueStats,
      project: {
        statusBreakdown,
        recentChecks24h: recentChecks,
      },
      lastUpdated: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Status endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get monitoring status' },
      { status: 500 }
    )
  }
}
