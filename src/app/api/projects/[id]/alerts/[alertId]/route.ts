import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateAlertSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  alertType: z.enum([
    'url_dropped',
    'url_indexed',
    'error_detected',
    'bulk_drop',
    'not_indexed_duration',
    'specific_error',
  ]).optional(),
  isActive: z.boolean().optional(),
  triggerCondition: z.any().optional(),
})

// GET /api/projects/:id/alerts/:alertId
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership and get alert
    const alert = await prisma.alert.findFirst({
      where: {
        id: params.alertId,
        projectId: params.id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        _count: {
          select: {
            alertHistory: true,
          },
        },
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    return NextResponse.json(alert)
  } catch (error: any) {
    console.error('Error fetching alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/projects/:id/alerts/:alertId
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const alert = await prisma.alert.findFirst({
      where: {
        id: params.alertId,
        projectId: params.id,
        project: {
          userId: session.user.id,
        },
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateAlertSchema.parse(body)

    // Update the alert
    const updated = await prisma.alert.update({
      where: { id: params.alertId },
      data: validatedData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/projects/:id/alerts/:alertId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; alertId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const alert = await prisma.alert.findFirst({
      where: {
        id: params.alertId,
        projectId: params.id,
        project: {
          userId: session.user.id,
        },
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Delete the alert (alert history will be cascade deleted)
    await prisma.alert.delete({
      where: { id: params.alertId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting alert:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
