import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { getRecentChanges, getChangeStats } from '@/lib/monitoring/change-detection'

// GET /api/projects/:id/recent-changes - Get recent status changes
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
    const hours = parseInt(searchParams.get('hours') || '24')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get recent changes
    const changes = await getRecentChanges(projectId, hours)

    // Get change statistics
    const stats = await getChangeStats(projectId, 7) // Last 7 days

    return NextResponse.json({
      changes: changes.slice(0, limit),
      totalChanges: changes.length,
      stats,
      timeframe: {
        hours,
        from: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Recent changes endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to get recent changes' },
      { status: 500 }
    )
  }
}
