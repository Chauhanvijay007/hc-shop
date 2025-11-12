import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateFilterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  filterData: z.any().optional(),
  isPublic: z.boolean().optional(),
})

// DELETE /api/projects/:id/filters/:filterId
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; filterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: params.filterId,
        projectId: params.id,
        userId: session.user.id,
      },
    })

    if (!filter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    await prisma.savedFilter.delete({
      where: { id: params.filterId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting filter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/projects/:id/filters/:filterId
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; filterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const filter = await prisma.savedFilter.findFirst({
      where: {
        id: params.filterId,
        projectId: params.id,
        userId: session.user.id,
      },
    })

    if (!filter) {
      return NextResponse.json({ error: 'Filter not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateFilterSchema.parse(body)

    const updated = await prisma.savedFilter.update({
      where: { id: params.filterId },
      data: validatedData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error updating filter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
