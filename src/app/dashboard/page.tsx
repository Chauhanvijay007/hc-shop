'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { TrendChart } from '@/components/analytics/trend-chart'
import { StatusDistribution } from '@/components/analytics/status-distribution'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Globe, Plus, BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Project {
  id: string
  name: string
  domain: string
  _count: { urls: number }
}

interface Stats {
  totalUrls: number
  indexedUrls: number
  notIndexedUrls: number
  urlsWithErrors: number
  change24h: number
  change7d: number
  indexedPercentage: number
}

interface TrendDataPoint {
  date: string
  indexed: number
  notIndexed: number
  discovered: number
  errors: number
}

interface TrendResponse {
  trends: TrendDataPoint[]
  summary: { totalUrls: number; indexed: number; notIndexed: number; discovered: number; errors: number }
}

interface RecentChange {
  id: string
  urlId: string
  changedAt: string
  oldState: string
  newState: string
  url: { url: string; priority: string; tags: string[] }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trends, setTrends] = useState<TrendResponse | null>(null)
  const [recentChanges, setRecentChanges] = useState<RecentChange[]>([])
  const [trendDays, setTrendDays] = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin')
  }, [status, router])

  useEffect(() => {
    if (session) fetchProjects()
  }, [session])

  useEffect(() => {
    if (selectedProject) {
      fetchStats(selectedProject.id)
      fetchTrends(selectedProject.id, trendDays)
      fetchRecentChanges(selectedProject.id)
    }
  }, [selectedProject, trendDays])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        if (data.length > 0) setSelectedProject(data[0])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`)
      if (res.ok) setStats(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchTrends(projectId: string, days: number) {
    try {
      const res = await fetch(`/api/projects/${projectId}/trends?days=${days}`)
      if (res.ok) setTrends(await res.json())
    } catch (e) {
      console.error(e)
    }
  }

  async function fetchRecentChanges(projectId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/recent-changes`)
      if (res.ok) {
        const data = await res.json()
        setRecentChanges(data.changes || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  function changeIcon(oldState: string, newState: string) {
    if (newState === 'indexed') return <TrendingUp className="h-3.5 w-3.5 text-green-500" />
    if (oldState === 'indexed') return <TrendingDown className="h-3.5 w-3.5 text-red-500" />
    return <Minus className="h-3.5 w-3.5 text-gray-400" />
  }

  function stateBadge(state: string) {
    switch (state) {
      case 'indexed': return <Badge variant="success" className="text-xs">Indexed</Badge>
      case 'not_indexed': return <Badge variant="destructive" className="text-xs">Not Indexed</Badge>
      case 'discovered': return <Badge variant="warning" className="text-xs">Discovered</Badge>
      default: return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Loading...</div></div>
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Indexing Insight</CardTitle>
              <CardDescription>Get started by creating your first project to monitor Google indexing status</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Indexing Insight</h1>
              <p className="text-sm text-gray-600 mt-1">{selectedProject?.domain}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedProject?.id || ''}
                onChange={e => {
                  const p = projects.find(p => p.id === e.target.value)
                  if (p) setSelectedProject(p)
                }}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Button onClick={() => router.push('/projects/new')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total URLs" value={stats.totalUrls} icon={Globe} variant="default" />
            <StatsCard
              title="Indexed"
              value={`${stats.indexedUrls} (${stats.indexedPercentage}%)`}
              icon={CheckCircle}
              change={stats.change24h}
              changeLabel="new in 24h"
              variant="success"
            />
            <StatsCard title="Not Indexed" value={stats.notIndexedUrls} icon={XCircle} variant="warning" />
            <StatsCard title="Errors" value={stats.urlsWithErrors} icon={AlertCircle} variant="error" />
          </div>
        )}

        {/* Trend Chart + Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Indexing Trends</CardTitle>
                  <CardDescription>URL status changes over time</CardDescription>
                </div>
                <select
                  value={trendDays}
                  onChange={e => setTrendDays(Number(e.target.value))}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart data={trends?.trends || []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              {trends?.summary ? (
                <StatusDistribution
                  indexed={trends.summary.indexed}
                  notIndexed={trends.summary.notIndexed}
                  discovered={trends.summary.discovered}
                  errors={trends.summary.errors}
                />
              ) : stats ? (
                <StatusDistribution
                  indexed={stats.indexedUrls}
                  notIndexed={stats.notIndexedUrls}
                  discovered={0}
                  errors={stats.urlsWithErrors}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Recent Changes + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Status Changes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Changes</CardTitle>
                  <CardDescription>Latest indexing status changes</CardDescription>
                </div>
                <Badge variant="outline">{stats?.change7d || 0} this week</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {recentChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent status changes. Run monitoring to detect changes.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentChanges.slice(0, 8).map(change => (
                    <div
                      key={change.id}
                      className="flex items-start gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-md -mx-1.5"
                      onClick={() => router.push(`/projects/${selectedProject?.id}/urls/${change.urlId}`)}
                    >
                      <div className="mt-0.5">{changeIcon(change.oldState, change.newState)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate text-gray-700">{change.url.url}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {stateBadge(change.oldState)}
                          <span className="text-gray-400 text-xs">→</span>
                          {stateBadge(change.newState)}
                          <span className="text-xs text-muted-foreground ml-1">{formatRelativeTime(change.changedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Navigate to key features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/projects/${selectedProject?.id}/urls`)}
              >
                <Globe className="h-4 w-4 mr-2" />
                View All URLs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/projects/${selectedProject?.id}/urls/add`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add URLs
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/projects/${selectedProject?.id}/analytics`)}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Segmentation Analytics
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/projects/${selectedProject?.id}/crawl-analysis`)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Crawl Budget Analysis
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
