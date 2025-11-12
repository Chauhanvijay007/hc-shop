import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createAlertSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  alertType: z.enum([
    'url_dropped',
    'url_indexed',
    'error_detected',
    'bulk_drop',
    'not_indexed_duration',
    'specific_error',
  ]),
  isActive: z.boolean().default(true),
  triggerCondition: z.any().optional(),
})

// GET /api/projects/:id/alerts
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

    // Get all alerts for this project
    const alerts = await prisma.alert.findMany({
      where: {
        projectId: params.id,
      },
      include: {
        _count: {
          select: {
            alertHistory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(alerts)
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/:id/alerts
export async function POST(
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

    const body = await request.json()
    const validatedData = createAlertSchema.parse(body)

    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        ...validatedData,
        projectId: params.id,
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
