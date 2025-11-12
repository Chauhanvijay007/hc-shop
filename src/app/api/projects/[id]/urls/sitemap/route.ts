import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { fetchAllSitemapUrls, extractUniqueUrls, isValidSitemapUrl } from '@/lib/sitemap/parser'
import { createUrlHash } from '@/lib/utils'
import { Priority, MonitoringFrequency } from '@prisma/client'

const sitemapImportSchema = z.object({
  sitemapUrl: z.string().url('Must be a valid URL'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  tags: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
  monitoringFrequency: z.enum(['daily', 'weekly']).optional(),
})

// POST /api/projects/:id/urls/sitemap - Import URLs from sitemap
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
    const validatedData = sitemapImportSchema.parse(body)

    // Validate sitemap URL format
    if (!isValidSitemapUrl(validatedData.sitemapUrl)) {
      return NextResponse.json(
        { error: 'Invalid sitemap URL format. URL should end with .xml or contain "sitemap"' },
        { status: 400 }
      )
    }

    console.log(`📥 Starting sitemap import from: ${validatedData.sitemapUrl}`)

    // Fetch and parse sitemap (this may take a while for large sitemaps)
    const sitemapUrls = await fetchAllSitemapUrls(validatedData.sitemapUrl)
    const urls = extractUniqueUrls(sitemapUrls)

    console.log(`✅ Found ${urls.length} unique URLs in sitemap`)

    if (urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs found in sitemap' },
        { status: 400 }
      )
    }

    // Check for existing URLs
    const urlHashes = urls.map(url => createUrlHash(url))
    const existingUrls = await prisma.url.findMany({
      where: {
        projectId,
        urlHash: { in: urlHashes },
      },
      select: { urlHash: true },
    })

    const existingHashSet = new Set(existingUrls.map(u => u.urlHash))

    // Filter out existing URLs
    const newUrls = urls.filter(url => !existingHashSet.has(createUrlHash(url)))

    if (newUrls.length === 0) {
      return NextResponse.json({
        message: 'All URLs from sitemap already exist in project',
        imported: 0,
        skipped: urls.length,
        totalInSitemap: urls.length,
      })
    }

    console.log(`📝 Importing ${newUrls.length} new URLs...`)

    // Batch create URLs (limit to reasonable batch size)
    const BATCH_SIZE = 1000
    let importedCount = 0

    for (let i = 0; i < newUrls.length; i += BATCH_SIZE) {
      const batch = newUrls.slice(i, i + BATCH_SIZE)

      const urlsData = batch.map(url => ({
        projectId,
        url,
        urlHash: createUrlHash(url),
        priority: (validatedData.priority as Priority) || Priority.medium,
        tags: validatedData.tags || [],
        groups: validatedData.groups || [],
        sitemapUrl: validatedData.sitemapUrl,
        monitoringFrequency: (validatedData.monitoringFrequency as MonitoringFrequency) || MonitoringFrequency.daily,
      }))

      await prisma.url.createMany({
        data: urlsData,
        skipDuplicates: true,
      })

      importedCount += batch.length
      console.log(`✅ Imported batch ${i / BATCH_SIZE + 1}: ${batch.length} URLs`)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} URLs from sitemap`,
      imported: importedCount,
      skipped: urls.length - newUrls.length,
      totalInSitemap: urls.length,
      sitemapUrl: validatedData.sitemapUrl,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('Sitemap import error:', error)

    // Provide user-friendly error messages
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Sitemap request timed out. The sitemap may be too large or the server is not responding.' },
        { status: 504 }
      )
    }

    if (error.message.includes('404')) {
      return NextResponse.json(
        { error: 'Sitemap not found. Please check the URL is correct.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to import sitemap' },
      { status: 500 }
    )
  }
}
