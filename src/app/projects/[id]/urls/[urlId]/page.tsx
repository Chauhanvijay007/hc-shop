'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProjectNav } from '@/components/layout/project-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ArrowLeft, CheckCircle, Clock, Globe, AlertCircle } from 'lucide-react'

interface UrlDetail {
  id: string
  url: string
  priority: string
  tags: string[]
  groups: string[]
  createdAt: string
  lastCheckedAt: string | null
  project: { name: string; domain: string }
}

interface Check {
  id: string
  checkedAt: string
  indexingState: string
  coverageState: string
  verdict: string | null
  lastCrawlTime: string | null
  crawlAllowed: boolean | null
  pageFetchState: string | null
  robotsTxtState: string | null
  userCanonical: string | null
  googleCanonical: string | null
  mobileUsability: string | null
  errorMessage: string | null
}

interface StatusChange {
  id: string
  changedAt: string
  oldState: string
  newState: string
  oldVerdict: string | null
  newVerdict: string | null
}

const STATE_VALUES: Record<string, number> = {
  indexed: 3,
  discovered: 2,
  not_indexed: 1,
  unknown: 0,
}

function stateBadge(state: string) {
  switch (state) {
    case 'indexed': return <Badge variant="success">Indexed</Badge>
    case 'not_indexed': return <Badge variant="destructive">Not Indexed</Badge>
    case 'discovered': return <Badge variant="warning">Discovered</Badge>
    default: return <Badge variant="outline">Unknown</Badge>
  }
}

function formatDate(d: string | null) {
  if (!d) return 'N/A'
  return format(new Date(d), 'MMM d, yyyy HH:mm')
}

export default function UrlDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const urlId = params.urlId as string

  const [urlData, setUrlData] = useState<UrlDetail | null>(null)
  const [latestCheck, setLatestCheck] = useState<Check | null>(null)
  const [checks, setChecks] = useState<Check[]>([])
  const [statusChanges, setStatusChanges] = useState<StatusChange[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/projects/${projectId}/urls/${urlId}/history?days=${days}`)
      .then(r => r.json())
      .then(data => {
        setUrlData(data.url)
        setLatestCheck(data.latestCheck)
        setChecks(data.checks)
        setStatusChanges(data.statusChanges)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId, urlId, days])

  // Build chart data from checks (reversed to chronological)
  const chartData = [...checks].reverse().map(c => ({
    label: format(new Date(c.checkedAt), 'MMM d'),
    state: STATE_VALUES[c.indexingState] ?? 0,
    stateLabel: c.indexingState,
  }))

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!urlData) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">URL not found.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />
      {/* URL breadcrumb bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push(`/projects/${projectId}/urls`)} className="text-muted-foreground hover:text-gray-900 flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-mono truncate text-gray-700">{urlData.url}</p>
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              {latestCheck && stateBadge(latestCheck.indexingState)}
              <Badge variant="outline" className="capitalize">{urlData.priority}</Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: metadata */}
          <div className="space-y-4">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {latestCheck ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Indexing</span>
                      {stateBadge(latestCheck.indexingState)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coverage</span>
                      <span className="capitalize">{latestCheck.coverageState}</span>
                    </div>
                    {latestCheck.verdict && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verdict</span>
                        <span className="text-right text-xs max-w-[160px]">{latestCheck.verdict}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Checked</span>
                      <span className="text-xs">{formatDate(latestCheck.checkedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Crawled</span>
                      <span className="text-xs">{formatDate(latestCheck.lastCrawlTime)}</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground">No checks yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Crawl Details */}
            {latestCheck && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Crawl Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crawl Allowed</span>
                    <span className={latestCheck.crawlAllowed === false ? 'text-red-500' : 'text-green-600'}>
                      {latestCheck.crawlAllowed === false ? 'No' : latestCheck.crawlAllowed === true ? 'Yes' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Robots.txt</span>
                    <span className="text-xs capitalize">{latestCheck.robotsTxtState?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Page Fetch</span>
                    <span className="text-xs capitalize">{latestCheck.pageFetchState?.replace(/_/g, ' ') || 'N/A'}</span>
                  </div>
                  {latestCheck.mobileUsability && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile</span>
                      <span className="text-xs capitalize">{latestCheck.mobileUsability}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Canonical */}
            {latestCheck && (latestCheck.userCanonical || latestCheck.googleCanonical) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Canonical URLs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {latestCheck.userCanonical && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">User Canonical</p>
                      <p className="font-mono break-all">{latestCheck.userCanonical}</p>
                    </div>
                  )}
                  {latestCheck.googleCanonical && (
                    <div>
                      <p className="text-muted-foreground font-medium mb-1">Google Canonical</p>
                      <p className={`font-mono break-all ${latestCheck.googleCanonical !== latestCheck.userCanonical ? 'text-orange-600' : ''}`}>
                        {latestCheck.googleCanonical}
                      </p>
                      {latestCheck.googleCanonical !== latestCheck.userCanonical && (
                        <p className="text-orange-600 mt-1">Canonical mismatch detected</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tags & Groups */}
            {(urlData.tags.length > 0 || urlData.groups.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tags & Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {urlData.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {urlData.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {urlData.groups.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Groups</p>
                      <div className="flex flex-wrap gap-1">
                        {urlData.groups.map(g => (
                          <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column: charts and history */}
          <div className="lg:col-span-2 space-y-4">
            {/* Indexing State History Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Indexing History</CardTitle>
                    <CardDescription>Status over the past {days} days</CardDescription>
                  </div>
                  <select
                    value={days}
                    onChange={e => setDays(Number(e.target.value))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} interval="preserveStartEnd" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 3]}
                        tickFormatter={v => ['?', 'Not Indexed', 'Discovered', 'Indexed'][v] || ''}
                        width={80}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12 }}
                        formatter={(v: number) => [['?', 'Not Indexed', 'Discovered', 'Indexed'][v], 'State']}
                      />
                      <Line
                        type="stepAfter"
                        dataKey="state"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">No check history in this period.</p>
                )}
              </CardContent>
            </Card>

            {/* Status Change Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status Changes</CardTitle>
                <CardDescription>{statusChanges.length} changes in the last {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                {statusChanges.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">No status changes in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {statusChanges.map(sc => (
                      <div key={sc.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {stateBadge(sc.oldState)}
                            <span className="text-muted-foreground">→</span>
                            {stateBadge(sc.newState)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(sc.changedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Checks Log */}
            <Card>
              <CardHeader>
                <CardTitle>Check Log</CardTitle>
                <CardDescription>{checks.length} checks in the last {days} days</CardDescription>
              </CardHeader>
              <CardContent>
                {checks.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">No checks recorded.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">State</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Coverage</th>
                          <th className="text-left py-2 font-medium text-muted-foreground">Last Crawled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {checks.slice(0, 20).map(c => (
                          <tr key={c.id}>
                            <td className="py-2 text-muted-foreground">{formatDate(c.checkedAt)}</td>
                            <td className="py-2">{stateBadge(c.indexingState)}</td>
                            <td className="py-2 capitalize text-muted-foreground">{c.coverageState}</td>
                            <td className="py-2 text-muted-foreground">{formatDate(c.lastCrawlTime)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
