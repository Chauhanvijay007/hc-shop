'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

interface SegmentData {
  segment: string
  total: number
  indexed: number
  notIndexed: number
  errors: number
  indexedPct: number
}

interface SegmentsResponse {
  byPriority: SegmentData[]
  byTag: SegmentData[]
  byGroup: SegmentData[]
}

const PRIORITY_COLORS: Record<string, string> = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#16a34a',
}

function SegmentBarChart({ data, label }: { data: SegmentData[]; label: string }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-muted-foreground text-sm py-6">No {label} data yet.</p>
  }

  const chartData = data.map(d => ({
    name: d.segment.length > 20 ? d.segment.slice(0, 20) + '…' : d.segment,
    fullName: d.segment,
    Indexed: d.indexed,
    'Not Indexed': d.notIndexed,
    Errors: d.errors,
    total: d.total,
    pct: d.indexedPct,
  }))

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: number, name: string, props: any) => [value, name]}
          labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="Indexed" stackId="a" fill="#16a34a" />
        <Bar dataKey="Not Indexed" stackId="a" fill="#dc2626" />
        <Bar dataKey="Errors" stackId="a" fill="#9333ea" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function IndexedPctChart({ data }: { data: SegmentData[] }) {
  if (!data || data.length === 0) return null

  const chartData = data
    .filter(d => d.total > 0)
    .map(d => ({
      name: d.segment.charAt(0).toUpperCase() + d.segment.slice(1),
      pct: d.indexedPct,
      total: d.total,
    }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(v: number) => [`${v}%`, 'Indexed']}
        />
        <Bar dataKey="pct" name="Indexed %" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.pct >= 80 ? '#16a34a' : entry.pct >= 50 ? '#d97706' : '#dc2626'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [data, setData] = useState<SegmentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'priority' | 'tags' | 'groups'>('priority')

  useEffect(() => {
    fetch(`/api/projects/${projectId}/segments`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  const activeData =
    activeTab === 'priority' ? data?.byPriority :
    activeTab === 'tags' ? data?.byTag :
    data?.byGroup

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                ← Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold">Segmentation Analytics</h1>
                <p className="text-sm text-muted-foreground">Indexing performance by priority, tags, and groups</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push(`/projects/${projectId}/crawl-analysis`)}>
              Crawl Budget Analysis
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Priority Summary Cards */}
        {data?.byPriority && (
          <div className="grid grid-cols-3 gap-4">
            {data.byPriority.map(p => (
              <Card key={p.segment}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm capitalize flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: PRIORITY_COLORS[p.segment.charAt(0).toUpperCase() + p.segment.slice(1)] || '#888' }}
                    />
                    {p.segment} Priority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{p.indexedPct}%</div>
                  <p className="text-xs text-muted-foreground">{p.indexed} / {p.total} indexed</p>
                  {/* Mini progress bar */}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${p.indexedPct}%`,
                        background: p.indexedPct >= 80 ? '#16a34a' : p.indexedPct >= 50 ? '#d97706' : '#dc2626',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Priority % chart */}
        {data?.byPriority && (
          <Card>
            <CardHeader>
              <CardTitle>Indexed % by Priority</CardTitle>
              <CardDescription>Are high-priority pages performing better?</CardDescription>
            </CardHeader>
            <CardContent>
              <IndexedPctChart data={data.byPriority} />
            </CardContent>
          </Card>
        )}

        {/* Tabbed Segment Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Segment Breakdown</CardTitle>
                <CardDescription>Indexing status across your URL segments</CardDescription>
              </div>
              <div className="flex gap-1">
                {(['priority', 'tags', 'groups'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SegmentBarChart data={activeData || []} label={activeTab} />
          </CardContent>
        </Card>

        {/* Summary Table */}
        {activeData && activeData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-2 font-medium text-muted-foreground capitalize">{activeTab.slice(0, -1)}</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Indexed</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Not Indexed</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">Errors</th>
                    <th className="text-right py-2 font-medium text-muted-foreground">% Indexed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeData.map(row => (
                    <tr key={row.segment} className="hover:bg-gray-50">
                      <td className="py-2 font-medium capitalize">{row.segment}</td>
                      <td className="py-2 text-right">{row.total}</td>
                      <td className="py-2 text-right text-green-600">{row.indexed}</td>
                      <td className="py-2 text-right text-red-600">{row.notIndexed}</td>
                      <td className="py-2 text-right text-purple-600">{row.errors}</td>
                      <td className="py-2 text-right">
                        <span className={`font-medium ${
                          row.indexedPct >= 80 ? 'text-green-600' :
                          row.indexedPct >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {row.indexedPct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
