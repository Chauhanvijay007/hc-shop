'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ProjectNav } from '@/components/layout/project-nav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Filter, Save, X, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { UrlWithChecks } from '@/types'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'not_indexed', label: 'Not Indexed' },
  { value: 'discovered', label: 'Discovered' },
  { value: 'unknown', label: 'Unknown' },
]

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

function StatusBadge({ state }: { state: string }) {
  switch (state) {
    case 'indexed': return <Badge variant="success">Indexed</Badge>
    case 'not_indexed': return <Badge variant="destructive">Not Indexed</Badge>
    case 'discovered': return <Badge variant="warning">Discovered</Badge>
    default: return <Badge variant="outline">Unknown</Badge>
  }
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = { high: 'bg-red-400', medium: 'bg-yellow-400', low: 'bg-green-400' }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority] || 'bg-gray-300'}`} title={priority} />
}

function UrlRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

function UrlsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = params.id as string

  const [urls, setUrls] = useState<UrlWithChecks[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Filters
  const [search, setSearch] = useState(searchParams.get('urlPattern') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('indexingState') || '')
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '')
  const [showFilters, setShowFilters] = useState(
    !!(searchParams.get('indexingState') || searchParams.get('priority'))
  )

  // Save filter modal
  const [showSaveFilter, setShowSaveFilter] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [savingFilter, setSavingFilter] = useState(false)

  const hasActiveFilters = !!(search || statusFilter || priorityFilter)

  const fetchUrls = useCallback(async () => {
    setLoading(true)
    try {
      const qp = new URLSearchParams({ page: page.toString(), limit: '50' })
      if (search) qp.set('urlPattern', search)
      if (statusFilter) qp.set('indexingState', statusFilter)
      if (priorityFilter) qp.set('priority', priorityFilter)

      const res = await fetch(`/api/projects/${projectId}/urls?${qp}`)
      if (res.ok) {
        const data = await res.json()
        setUrls(data.urls)
        setTotal(data.pagination.total)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [projectId, page, search, statusFilter, priorityFilter])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter])

  useEffect(() => {
    fetchUrls()
  }, [fetchUrls])

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setPriorityFilter('')
  }

  async function saveCurrentFilter() {
    if (!filterName.trim()) return
    setSavingFilter(true)
    try {
      const filterData: Record<string, unknown> = {}
      if (statusFilter) filterData.indexingState = [statusFilter]
      if (priorityFilter) filterData.priority = [priorityFilter]
      if (search) filterData.urlPattern = search

      await fetch(`/api/projects/${projectId}/filters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: filterName.trim(), filterData }),
      })
      setShowSaveFilter(false)
      setFilterName('')
    } catch (e) {
      console.error(e)
    } finally {
      setSavingFilter(false)
    }
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>
                URLs
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  {loading ? '…' : `${total} total`}
                </span>
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search URLs…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 w-52"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Toggle filters */}
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(v => !v)}
                  className="relative"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                  Filters
                  {(statusFilter || priorityFilter) && (
                    <span className="ml-1.5 bg-white text-blue-600 rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
                      {[statusFilter, priorityFilter].filter(Boolean).length}
                    </span>
                  )}
                </Button>

                {/* Save filter */}
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={() => setShowSaveFilter(true)}>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save
                  </Button>
                )}

                <Button size="sm" onClick={() => router.push(`/projects/${projectId}/urls/add`)}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add URLs
                </Button>
              </div>
            </div>

            {/* Filter row */}
            {showFilters && (
              <div className="flex items-center gap-3 flex-wrap pt-3 border-t mt-3">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Status</Label>
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="text-sm border rounded-md px-2 py-1.5 bg-white"
                  >
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Priority</Label>
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="text-sm border rounded-md px-2 py-1.5 bg-white"
                  >
                    {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-gray-900 flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
              </div>
            )}

            {/* Active filter chips when filter row is hidden */}
            {!showFilters && hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap pt-2">
                {statusFilter && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    Status: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
                    <button onClick={() => setStatusFilter('')}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {priorityFilter && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    Priority: {PRIORITY_OPTIONS.find(o => o.value === priorityFilter)?.label}
                    <button onClick={() => setPriorityFilter('')}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
                {search && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    URL: "{search}"
                    <button onClick={() => setSearch('')}><X className="h-3 w-3" /></button>
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Save filter modal */}
            {showSaveFilter && (
              <div className="mb-4 p-4 border rounded-lg bg-blue-50/40 border-blue-200">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Filter preset name…"
                    value={filterName}
                    onChange={e => setFilterName(e.target.value)}
                    className="flex-1"
                    onKeyDown={e => e.key === 'Enter' && saveCurrentFilter()}
                    autoFocus
                  />
                  <Button size="sm" onClick={saveCurrentFilter} disabled={savingFilter || !filterName.trim()}>
                    {savingFilter ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowSaveFilter(false); setFilterName('') }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Saving current filter as a preset. Access it from the Filters tab.
                </p>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => <UrlRowSkeleton key={i} />)}
              </div>
            ) : urls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {hasActiveFilters
                  ? <><p className="font-medium">No URLs match the current filters</p><button className="text-sm text-blue-600 mt-1 hover:underline" onClick={clearFilters}>Clear filters</button></>
                  : <p>No URLs found. <button className="text-blue-600 hover:underline" onClick={() => router.push(`/projects/${projectId}/urls/add`)}>Add your first URL</button></p>
                }
              </div>
            ) : (
              <div className="space-y-2">
                {urls.map(url => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${projectId}/urls/${url.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <PriorityDot priority={url.priority} />
                        <p className="text-sm font-medium truncate">{url.url}</p>
                        {url.latestCheck && <StatusBadge state={url.latestCheck.indexingState} />}
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-4">
                        <p className="text-xs text-muted-foreground">
                          {url.latestCheck ? formatRelativeTime(url.latestCheck.checkedAt) : 'Never checked'}
                        </p>
                        {url.tags.length > 0 && (
                          <div className="flex gap-1">
                            {url.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs py-0">{tag}</Badge>
                            ))}
                            {url.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{url.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 -rotate-90 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {total} URLs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function UrlsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <UrlsContent />
    </Suspense>
  )
}
