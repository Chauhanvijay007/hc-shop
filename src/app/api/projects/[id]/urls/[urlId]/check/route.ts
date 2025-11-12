import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { googleURLInspection } from '@/lib/google-api/url-inspection'

// POST /api/projects/:id/urls/:urlId/check - Manually trigger URL check
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; urlId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify project ownership and get URL
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const url = await prisma.url.findFirst({
      where: {
        id: params.urlId,
        projectId: params.id,
      },
    })

    if (!url) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 })
    }

    // Perform inspection
    const check = await googleURLInspection.inspectAndStore(
      session.user.id,
      url.id,
      project.searchConsoleProperty,
      url.url
    )

    return NextResponse.json({
      message: 'URL check completed',
      check: {
        indexingState: check.indexingState,
        coverageState: check.coverageState,
        verdict: check.verdict,
        checkedAt: check.checkedAt,
        errorMessage: check.errorMessage,
      },
    })
  } catch (error) {
    console.error('Error checking URL:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
