import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { createUrlHash } from '@/lib/utils'
import { Priority, MonitoringFrequency } from '@prisma/client'

const addUrlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  monitoringFrequency: z.enum(['daily', 'weekly', 'custom']).optional(),
})

const addUrlsSchema = z.object({
  urls: z.array(z.string().url('Must be a valid URL')),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
})

// GET /api/projects/:id/urls - List URLs with optional filters
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

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const indexingState = searchParams.get('indexingState')?.split(',')
    const priority = searchParams.get('priority')?.split(',')
    const urlPattern = searchParams.get('urlPattern')
    const isActive = searchParams.get('isActive')

    // Build where clause
    const where: any = {
      projectId: params.id,
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (priority && priority.length > 0) {
      where.priority = { in: priority }
    }

    if (urlPattern) {
      where.url = { contains: urlPattern, mode: 'insensitive' }
    }

    // Get URLs with latest check
    const [urls, total] = await Promise.all([
      prisma.url.findMany({
        where,
        include: {
          indexingChecks: {
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.url.count({ where }),
    ])

    // Filter by indexing state if provided (post-query filter since it's a related field)
    let filteredUrls = urls
    if (indexingState && indexingState.length > 0) {
      filteredUrls = urls.filter(url =>
        url.indexingChecks[0] && indexingState.includes(url.indexingChecks[0].indexingState)
      )
    }

    // Transform data
    const urlsWithChecks = filteredUrls.map(url => ({
      id: url.id,
      url: url.url,
      priority: url.priority,
      tags: url.tags,
      groups: url.groups,
      isActive: url.isActive,
      createdAt: url.createdAt,
      latestCheck: url.indexingChecks[0] ? {
        indexingState: url.indexingChecks[0].indexingState,
        coverageState: url.indexingChecks[0].coverageState,
        verdict: url.indexingChecks[0].verdict,
        checkedAt: url.indexingChecks[0].checkedAt,
        errorMessage: url.indexingChecks[0].errorMessage,
      } : null,
    }))

    return NextResponse.json({
      urls: urlsWithChecks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching URLs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/projects/:id/urls - Add single URL
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
    const validatedData = addUrlSchema.parse(body)

    const urlHash = createUrlHash(validatedData.url)

    // Check if URL already exists
    const existingUrl = await prisma.url.findUnique({
      where: {
        projectId_urlHash: {
          projectId: params.id,
          urlHash,
        },
      },
    })

    if (existingUrl) {
      return NextResponse.json({ error: 'URL already exists in this project' }, { status: 409 })
    }

    const url = await prisma.url.create({
      data: {
        projectId: params.id,
        url: validatedData.url,
        urlHash,
        priority: validatedData.priority as Priority || Priority.medium,
        tags: validatedData.tags || [],
        groups: validatedData.groups || [],
        monitoringFrequency: validatedData.monitoringFrequency as MonitoringFrequency || MonitoringFrequency.daily,
      },
    })

    return NextResponse.json(url, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error adding URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
