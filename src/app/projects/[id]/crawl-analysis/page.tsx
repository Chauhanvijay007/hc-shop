'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProjectNav } from '@/components/layout/project-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, XCircle } from 'lucide-react'

interface CrawlSummary {
  totalUrls: number
  neverChecked: number
  neverCrawled: number
  crawled: number
  crawledButNotIndexed: number
  blockedByRobots: number
  crawlCoverage: number
  crawlEfficiency: number
}

interface UrlCrawlData {
  urlId: string
  url: string
  priority: string
  lastCrawlTime: string | null
  lastCheckedAt: string | null
  indexingState: string | null
  coverageState: string | null
  crawlAllowed: boolean | null
  robotsTxtState: string | null
  pageFetchState: string | null
  checksLast30Days: number
}

export default function CrawlAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [summary, setSummary] = useState<CrawlSummary | null>(null)
  const [urls, setUrls] = useState<UrlCrawlData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'wasted' | 'uncrawled' | 'blocked'>('overview')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/crawl-analysis`)
      .then(r => r.json())
      .then(data => {
        setSummary(data.summary)
        setUrls(data.urls)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  const priorityChartData = ['high', 'medium', 'low'].map(p => ({
    priority: p.charAt(0).toUpperCase() + p.slice(1),
    checked: urls.filter(u => u.priority === p && u.lastCheckedAt).length,
    unchecked: urls.filter(u => u.priority === p && !u.lastCheckedAt).length,
  }))

  const wastedUrls = urls.filter(u => u.lastCrawlTime && u.indexingState !== 'indexed')
  const uncrawledUrls = urls.filter(u => u.lastCheckedAt && !u.lastCrawlTime)
  const blockedUrls = urls.filter(u => u.crawlAllowed === false || u.robotsTxtState === 'BLOCKED_BY_ROBOTS_TXT')

  function formatDate(d: string | null) {
    if (!d) return 'N/A'
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function stateBadge(state: string | null) {
    switch (state) {
      case 'indexed': return <Badge variant="success">Indexed</Badge>
      case 'not_indexed': return <Badge variant="destructive">Not Indexed</Badge>
      case 'discovered': return <Badge variant="warning">Discovered</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Crawl Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{summary.crawlCoverage}%</div>
                <p className="text-xs text-muted-foreground mt-1">{summary.crawled} / {summary.totalUrls} URLs crawled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Crawl Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{summary.crawlEfficiency}%</div>
                <p className="text-xs text-muted-foreground mt-1">of crawled URLs are indexed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-orange-500" />
                  Wasted Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{summary.crawledButNotIndexed}</div>
                <p className="text-xs text-muted-foreground mt-1">crawled but not indexed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Blocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{summary.blockedByRobots}</div>
                <p className="text-xs text-muted-foreground mt-1">blocked by robots.txt</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Priority Coverage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Crawl Coverage by Priority</CardTitle>
            <CardDescription>Are high-priority URLs being checked?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="priority" type="category" tick={{ fontSize: 12 }} width={60} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="checked" name="Checked" fill="#16a34a" stackId="a" />
                <Bar dataKey="unchecked" name="Not Checked" fill="#e5e7eb" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {[
            { key: 'overview', label: 'All URLs' },
            { key: 'wasted', label: `Wasted Budget (${wastedUrls.length})` },
            { key: 'uncrawled', label: `Never Crawled (${uncrawledUrls.length})` },
            { key: 'blocked', label: `Blocked (${blockedUrls.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-muted-foreground hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* URL Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">URL</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Crawled</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Checks (30d)</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Robots</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(activeTab === 'overview' ? urls
                    : activeTab === 'wasted' ? wastedUrls
                    : activeTab === 'uncrawled' ? uncrawledUrls
                    : blockedUrls
                  ).slice(0, 100).map(u => (
                    <tr
                      key={u.urlId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/projects/${projectId}/urls/${u.urlId}`)}
                    >
                      <td className="px-4 py-3 max-w-xs">
                        <p className="truncate text-xs font-mono">{u.url}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{u.priority}</Badge>
                      </td>
                      <td className="px-4 py-3">{stateBadge(u.indexingState)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(u.lastCrawlTime)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={u.checksLast30Days === 0 ? 'text-red-500' : 'text-gray-700'}>
                          {u.checksLast30Days}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.robotsTxtState === 'BLOCKED_BY_ROBOTS_TXT'
                          ? <span className="text-red-500">Blocked</span>
                          : u.crawlAllowed === false
                          ? <span className="text-red-500">Disallowed</span>
                          : <span className="text-green-600">Allowed</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {urls.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No URLs found. Add URLs to your project and run monitoring to see crawl data.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
