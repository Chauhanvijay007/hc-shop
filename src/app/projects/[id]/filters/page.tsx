'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProjectNav } from '@/components/layout/project-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter, Plus, Trash2, X, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface FilterData {
  indexingState?: string[]
  coverageState?: string[]
  priority?: string[]
  tags?: string[]
  groups?: string[]
  urlPattern?: string
  hasErrors?: boolean
  statusChanged?: boolean
}

interface SavedFilter {
  id: string
  name: string
  description?: string | null
  filterData: FilterData
  isPublic: boolean
  createdAt: string
}

const INDEXING_STATE_OPTIONS = ['indexed', 'not_indexed', 'discovered', 'unknown']
const PRIORITY_OPTIONS = ['high', 'medium', 'low']

const STATE_LABELS: Record<string, string> = {
  indexed: 'Indexed',
  not_indexed: 'Not Indexed',
  discovered: 'Discovered',
  unknown: 'Unknown',
}

function FilterChips({ filterData }: { filterData: FilterData }) {
  const chips: string[] = []
  if (filterData.indexingState?.length) chips.push(`Status: ${filterData.indexingState.map(s => STATE_LABELS[s] || s).join(', ')}`)
  if (filterData.priority?.length) chips.push(`Priority: ${filterData.priority.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}`)
  if (filterData.urlPattern) chips.push(`URL contains: "${filterData.urlPattern}"`)
  if (filterData.tags?.length) chips.push(`Tags: ${filterData.tags.join(', ')}`)
  if (filterData.groups?.length) chips.push(`Groups: ${filterData.groups.join(', ')}`)
  if (filterData.hasErrors) chips.push('Has errors')
  if (filterData.statusChanged) chips.push('Status changed')

  if (chips.length === 0) return <span className="text-xs text-muted-foreground italic">No criteria</span>

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip, i) => (
        <Badge key={i} variant="secondary" className="text-xs font-normal">{chip}</Badge>
      ))}
    </div>
  )
}

interface CreateForm {
  name: string
  description: string
  urlPattern: string
  indexingState: string[]
  priority: string[]
  hasErrors: boolean
  statusChanged: boolean
}

const EMPTY_FORM: CreateForm = {
  name: '',
  description: '',
  urlPattern: '',
  indexingState: [],
  priority: [],
  hasErrors: false,
  statusChanged: false,
}

export default function FiltersPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [filters, setFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchFilters() }, [projectId])

  async function fetchFilters() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/filters`)
      if (res.ok) setFilters(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function createFilter() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')

    const filterData: FilterData = {}
    if (form.indexingState.length) filterData.indexingState = form.indexingState
    if (form.priority.length) filterData.priority = form.priority
    if (form.urlPattern.trim()) filterData.urlPattern = form.urlPattern.trim()
    if (form.hasErrors) filterData.hasErrors = true
    if (form.statusChanged) filterData.statusChanged = true

    try {
      const res = await fetch(`/api/projects/${projectId}/filters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || undefined, filterData }),
      })
      if (res.ok) {
        const saved = await res.json()
        setFilters(prev => [saved, ...prev])
        setShowCreate(false)
        setForm(EMPTY_FORM)
      } else {
        setError('Failed to save filter')
      }
    } catch (e) {
      setError('Failed to save filter')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFilter(id: string) {
    if (!confirm('Delete this saved filter?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/filters/${id}`, { method: 'DELETE' })
      if (res.ok) setFilters(prev => prev.filter(f => f.id !== id))
    } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  function applyFilter(f: SavedFilter) {
    const p = new URLSearchParams()
    const fd = f.filterData
    if (fd.indexingState?.length) p.set('indexingState', fd.indexingState.join(','))
    if (fd.priority?.length) p.set('priority', fd.priority.join(','))
    if (fd.urlPattern) p.set('urlPattern', fd.urlPattern)
    if (fd.hasErrors) p.set('hasErrors', 'true')
    router.push(`/projects/${projectId}/urls?${p.toString()}`)
  }

  function toggleMulti(arr: string[], value: string): string[] {
    return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Saved Filters</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Save URL filter presets to quickly segment your data</p>
          </div>
          <Button onClick={() => { setShowCreate(true); setError('') }}>
            <Plus className="h-4 w-4 mr-2" />
            New Filter
          </Button>
        </div>

        {/* Create Filter Panel */}
        {showCreate && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Create Saved Filter</CardTitle>
                <button onClick={() => { setShowCreate(false); setError('') }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-gray-900" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name + description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Filter Name</Label>
                  <Input
                    placeholder="e.g. All Errors, High Priority Drops"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="What does this filter show?"
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Indexing state */}
              <div className="space-y-1.5">
                <Label>Indexing Status</Label>
                <div className="flex flex-wrap gap-2">
                  {INDEXING_STATE_OPTIONS.map(state => (
                    <button
                      key={state}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, indexingState: toggleMulti(f.indexingState, state) }))}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        form.indexingState.includes(state)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {STATE_LABELS[state]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, priority: toggleMulti(f.priority, p) }))}
                      className={`px-3 py-1.5 text-xs rounded-full border capitalize transition-colors ${
                        form.priority.includes(p)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* URL pattern */}
              <div className="space-y-1.5">
                <Label>URL Contains</Label>
                <Input
                  placeholder="e.g. /blog/, /products/"
                  value={form.urlPattern}
                  onChange={e => setForm(f => ({ ...f, urlPattern: e.target.value }))}
                />
              </div>

              {/* Boolean flags */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasErrors}
                    onChange={e => setForm(f => ({ ...f, hasErrors: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Has errors only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.statusChanged}
                    onChange={e => setForm(f => ({ ...f, statusChanged: e.target.checked }))}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Status changed recently</span>
                </label>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={createFilter} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Filter'}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreate(false); setError('') }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}><CardContent className="p-5">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-64" />
              </CardContent></Card>
            ))}
          </div>
        ) : filters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Filter className="h-10 w-10 text-gray-300 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No saved filters yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save filter presets to quickly navigate to URL segments you care about.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Filter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filters.map(f => (
              <Card key={f.id} className="hover:border-blue-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm">{f.name}</h3>
                        {f.isPublic && <Badge variant="outline" className="text-xs">Public</Badge>}
                      </div>
                      {f.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
                      )}
                      <FilterChips filterData={f.filterData} />
                      <p className="text-xs text-muted-foreground mt-2">Created {formatDate(f.createdAt)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyFilter(f)}
                        title="Apply this filter to URL list"
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Apply
                      </Button>
                      <button
                        onClick={() => deleteFilter(f.id)}
                        disabled={deletingId === f.id}
                        className="p-1.5 text-muted-foreground hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Delete filter"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
