import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { createUrlHash } from '@/lib/utils'
import { Priority, MonitoringFrequency } from '@prisma/client'

const bulkImportSchema = z.object({
  urls: z.array(z.string().url('Must be a valid URL')),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
})

// POST /api/projects/:id/urls/bulk - Bulk import URLs
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
    const validatedData = bulkImportSchema.parse(body)

    // Remove duplicates
    const uniqueUrls = [...new Set(validatedData.urls)]

    // Check for existing URLs
    const urlHashes = uniqueUrls.map(url => createUrlHash(url))
    const existingUrls = await prisma.url.findMany({
      where: {
        projectId: params.id,
        urlHash: { in: urlHashes },
      },
      select: { urlHash: true },
    })

    const existingHashSet = new Set(existingUrls.map(u => u.urlHash))

    // Filter out existing URLs
    const newUrls = uniqueUrls.filter(url => !existingHashSet.has(createUrlHash(url)))

    if (newUrls.length === 0) {
      return NextResponse.json({
        message: 'All URLs already exist',
        imported: 0,
        skipped: uniqueUrls.length,
      })
    }

    // Bulk create
    const urlsData = newUrls.map(url => ({
      projectId: params.id,
      url,
      urlHash: createUrlHash(url),
      priority: validatedData.priority as Priority || Priority.medium,
      tags: validatedData.tags || [],
      groups: validatedData.groups || [],
      monitoringFrequency: MonitoringFrequency.daily,
    }))

    await prisma.url.createMany({
      data: urlsData,
    })

    return NextResponse.json({
      message: `Successfully imported ${newUrls.length} URLs`,
      imported: newUrls.length,
      skipped: uniqueUrls.length - newUrls.length,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error bulk importing URLs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
