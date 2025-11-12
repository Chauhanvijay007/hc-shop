import { prisma } from '@/lib/db/prisma'
import { IndexingCheckResult } from '../queue/types'
import { IndexingState, CoverageState } from '@prisma/client'

/**
 * Detect if there's a status change compared to the previous check
 */
export async function detectStatusChange(
  urlId: string,
  currentResult: IndexingCheckResult
) {
  // Get the most recent previous check
  const previousCheck = await prisma.indexingCheck.findFirst({
    where: { urlId },
    orderBy: { checkedAt: 'desc' },
    take: 1,
  })

  // If no previous check, this is the first check
  if (!previousCheck) {
    console.log(`No previous check found for URL ${urlId}, skipping change detection`)
    return null
  }

  // Map string states to enum values
  const currentIndexingState = mapToIndexingState(currentResult.indexingState)
  const currentCoverageState = mapToCoverageState(currentResult.coverageState)

  // Check if status has changed
  const statusChanged =
    previousCheck.indexingState !== currentIndexingState ||
    previousCheck.coverageState !== currentCoverageState

  if (!statusChanged) {
    return null
  }

  console.log(
    `📊 Status change detected for URL ${urlId}: ` +
    `${previousCheck.indexingState} -> ${currentIndexingState}, ` +
    `${previousCheck.coverageState} -> ${currentCoverageState}`
  )

  // Create a status change record
  const change = await prisma.statusChange.create({
    data: {
      urlId,
      changedAt: new Date(),
      oldState: previousCheck.indexingState,
      newState: currentIndexingState,
      oldVerdict: previousCheck.verdict,
      newVerdict: currentResult.verdict,
      notified: false,
    },
  })

  return change
}

/**
 * Get recent status changes for a project
 */
export async function getRecentChanges(projectId: string, hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  return prisma.statusChange.findMany({
    where: {
      changedAt: { gte: since },
      url: {
        projectId,
      },
    },
    include: {
      url: {
        select: {
          url: true,
          priority: true,
          tags: true,
        },
      },
    },
    orderBy: { changedAt: 'desc' },
  })
}

/**
 * Get unnotified status changes for a project
 */
export async function getUnnotifiedChanges(projectId: string) {
  return prisma.statusChange.findMany({
    where: {
      notified: false,
      url: {
        projectId,
      },
    },
    include: {
      url: {
        select: {
          url: true,
          priority: true,
          tags: true,
        },
      },
    },
    orderBy: { changedAt: 'desc' },
  })
}

/**
 * Mark status changes as notified
 */
export async function markChangesAsNotified(changeIds: string[]) {
  return prisma.statusChange.updateMany({
    where: {
      id: { in: changeIds },
    },
    data: {
      notified: true,
    },
  })
}

/**
 * Get status change statistics for a project
 */
export async function getChangeStats(projectId: string, days: number = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const changes = await prisma.statusChange.findMany({
    where: {
      changedAt: { gte: since },
      url: {
        projectId,
      },
    },
    select: {
      newState: true,
      oldState: true,
    },
  })

  // Count changes by type
  const stats = {
    totalChanges: changes.length,
    droppedFromIndex: changes.filter(
      c => c.oldState === IndexingState.indexed && c.newState !== IndexingState.indexed
    ).length,
    newlyIndexed: changes.filter(
      c => c.oldState !== IndexingState.indexed && c.newState === IndexingState.indexed
    ).length,
    discovered: changes.filter(c => c.newState === IndexingState.discovered).length,
  }

  return stats
}

// Helper functions to map API response strings to Prisma enums
function mapToIndexingState(state: string): IndexingState {
  const normalized = state.toLowerCase()

  if (normalized.includes('pass') || normalized === 'valid') {
    return IndexingState.indexed
  }
  if (normalized.includes('fail') || normalized.includes('error')) {
    return IndexingState.not_indexed
  }
  if (normalized.includes('neutral') || normalized.includes('discover')) {
    return IndexingState.discovered
  }

  return IndexingState.unknown
}

function mapToCoverageState(state: string): CoverageState {
  const normalized = state.toLowerCase()

  if (normalized.includes('valid')) {
    return CoverageState.valid
  }
  if (normalized.includes('excluded')) {
    return CoverageState.excluded
  }
  if (normalized.includes('error')) {
    return CoverageState.error
  }

  return CoverageState.unknown
}
