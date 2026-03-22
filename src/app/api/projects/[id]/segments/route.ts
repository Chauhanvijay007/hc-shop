import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/projects/:id/segments - Segmentation analytics by priority, tags, groups
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get latest check per URL with priority, tags, groups
    const urlsWithStatus = await prisma.$queryRaw<Array<{
      url_id: string
      priority: string
      tags: string[]
      groups: string[]
      indexing_state: string | null
      coverage_state: string | null
    }>>`
      SELECT
        u.id as url_id,
        u.priority,
        u.tags,
        u.groups,
        ic.indexing_state,
        ic.coverage_state
      FROM urls u
      LEFT JOIN LATERAL (
        SELECT indexing_state, coverage_state
        FROM indexing_checks
        WHERE url_id = u.id
        ORDER BY checked_at DESC
        LIMIT 1
      ) ic ON true
      WHERE u.project_id = ${params.id}
        AND u.is_active = true
    `

    // --- By Priority ---
    const priorityMap: Record<string, { total: number; indexed: number; notIndexed: number; errors: number }> = {
      high: { total: 0, indexed: 0, notIndexed: 0, errors: 0 },
      medium: { total: 0, indexed: 0, notIndexed: 0, errors: 0 },
      low: { total: 0, indexed: 0, notIndexed: 0, errors: 0 },
    }

    // --- By Tag ---
    const tagMap: Record<string, { total: number; indexed: number; notIndexed: number; errors: number }> = {}

    // --- By Group ---
    const groupMap: Record<string, { total: number; indexed: number; notIndexed: number; errors: number }> = {}

    for (const u of urlsWithStatus) {
      const isIndexed = u.indexing_state === 'indexed'
      const isNotIndexed = u.indexing_state === 'not_indexed' || u.indexing_state === 'discovered'
      const hasError = u.coverage_state === 'error'

      // Priority
      const prio = u.priority || 'medium'
      if (priorityMap[prio]) {
        priorityMap[prio].total++
        if (isIndexed) priorityMap[prio].indexed++
        if (isNotIndexed) priorityMap[prio].notIndexed++
        if (hasError) priorityMap[prio].errors++
      }

      // Tags
      for (const tag of u.tags || []) {
        if (!tagMap[tag]) tagMap[tag] = { total: 0, indexed: 0, notIndexed: 0, errors: 0 }
        tagMap[tag].total++
        if (isIndexed) tagMap[tag].indexed++
        if (isNotIndexed) tagMap[tag].notIndexed++
        if (hasError) tagMap[tag].errors++
      }

      // Groups
      for (const group of u.groups || []) {
        if (!groupMap[group]) groupMap[group] = { total: 0, indexed: 0, notIndexed: 0, errors: 0 }
        groupMap[group].total++
        if (isIndexed) groupMap[group].indexed++
        if (isNotIndexed) groupMap[group].notIndexed++
        if (hasError) groupMap[group].errors++
      }
    }

    const byPriority = Object.entries(priorityMap).map(([priority, stats]) => ({
      segment: priority,
      ...stats,
      indexedPct: stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0,
    }))

    const byTag = Object.entries(tagMap)
      .map(([tag, stats]) => ({
        segment: tag,
        ...stats,
        indexedPct: stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20) // top 20 tags

    const byGroup = Object.entries(groupMap)
      .map(([group, stats]) => ({
        segment: group,
        ...stats,
        indexedPct: stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20) // top 20 groups

    return NextResponse.json({ byPriority, byTag, byGroup })
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
