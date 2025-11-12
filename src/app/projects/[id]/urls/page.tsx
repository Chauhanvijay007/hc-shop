'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { UrlWithChecks } from '@/types'

export default function UrlsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [urls, setUrls] = useState<UrlWithChecks[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUrls()
  }, [projectId, page, search])

  const fetchUrls = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (search) {
        params.append('urlPattern', search)
      }

      const res = await fetch(`/api/projects/${projectId}/urls?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUrls(data.urls)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('Error fetching URLs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'indexed':
        return <Badge variant="success">Indexed</Badge>
      case 'not_indexed':
        return <Badge variant="destructive">Not Indexed</Badge>
      case 'discovered':
        return <Badge variant="warning">Discovered</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                ← Back to Dashboard
              </Button>
            </div>
            <Button onClick={() => router.push(`/projects/${projectId}/urls/add`)}>
              <Plus className="h-4 w-4 mr-2" />
              Add URLs
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>URLs ({total})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search URLs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : urls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No URLs found. Add your first URL to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {urls.map((url) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{url.url}</p>
                        {url.latestCheck && getStatusBadge(url.latestCheck.indexingState)}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-xs text-muted-foreground">
                          Last checked: {url.latestCheck ? formatRelativeTime(url.latestCheck.checkedAt) : 'Never'}
                        </p>
                        {url.tags.length > 0 && (
                          <div className="flex gap-1">
                            {url.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/urls/${url.id}`)}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {total > 50 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 50)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / 50)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
