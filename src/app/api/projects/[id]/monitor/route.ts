import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { addBulkCheckJob } from '@/lib/queue/queues'
import { z } from 'zod'

const monitorSchema = z.object({
  urlIds: z.array(z.string()).optional(),
  checkAll: z.boolean().optional(),
}).refine(data => data.urlIds || data.checkAll, {
  message: 'Either urlIds or checkAll must be provided',
})

// POST /api/projects/:id/monitor - Trigger manual monitoring
export async function POST(
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = monitorSchema.parse(body)

    let urlsToCheck: string[]

    if (validatedData.checkAll) {
      // Get all active URLs
      const urls = await prisma.url.findMany({
        where: {
          projectId,
          isActive: true,
        },
        select: { id: true },
      })
      urlsToCheck = urls.map(u => u.id)
    } else if (validatedData.urlIds) {
      urlsToCheck = validatedData.urlIds
    } else {
      return NextResponse.json(
        { error: 'Either urlIds or checkAll must be provided' },
        { status: 400 }
      )
    }

    if (urlsToCheck.length === 0) {
      return NextResponse.json(
        { error: 'No URLs to monitor' },
        { status: 400 }
      )
    }

    // Add bulk check job
    const job = await addBulkCheckJob({
      projectId,
      userId: session.user.id,
      urlIds: urlsToCheck,
      checkType: 'manual',
    })

    return NextResponse.json({
      success: true,
      jobId: job.id,
      urlCount: urlsToCheck.length,
      message: `Monitoring started for ${urlsToCheck.length} URLs`,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Monitor endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to start monitoring' },
      { status: 500 }
    )
  }
}
