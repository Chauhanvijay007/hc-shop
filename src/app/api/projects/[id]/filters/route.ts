import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createFilterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  filterData: z.object({
    indexingState: z.array(z.string()).optional(),
    coverageState: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional(),
    urlPattern: z.string().optional(),
    hasErrors: z.boolean().optional(),
    statusChanged: z.boolean().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
  isPublic: z.boolean().optional(),
})

// GET /api/projects/:id/filters - List saved filters
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

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get user's saved filters for this project
    const filters = await prisma.savedFilter.findMany({
      where: {
        projectId,
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(filters)
  } catch (error: any) {
    console.error('Error fetching saved filters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/:id/filters - Create saved filter
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

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createFilterSchema.parse(body)

    const filter = await prisma.savedFilter.create({
      data: {
        projectId,
        userId: session.user.id,
        name: validatedData.name,
        description: validatedData.description,
        filterData: validatedData.filterData,
        isPublic: validatedData.isPublic || false,
      },
    })

    return NextResponse.json(filter, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating saved filter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
