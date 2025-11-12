'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AddUrlsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [singleUrl, setSingleUrl] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleAddSingle = async () => {
    if (!singleUrl) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/projects/${projectId}/urls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleUrl }),
      })

      if (res.ok) {
        setSuccess('URL added successfully!')
        setSingleUrl('')
        setTimeout(() => router.push(`/projects/${projectId}/urls`), 1500)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add URL')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddBulk = async () => {
    if (!bulkUrls) return

    const urls = bulkUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0)

    if (urls.length === 0) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/projects/${projectId}/urls/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(data.message)
        setBulkUrls('')
        setTimeout(() => router.push(`/projects/${projectId}/urls`), 2000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to add URLs')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}/urls`)}>
            ← Back to URLs
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Add URLs</CardTitle>
            <CardDescription>
              Add URLs to monitor their Google indexing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="single">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single URL</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    placeholder="https://example.com/page"
                    value={singleUrl}
                    onChange={(e) => setSingleUrl(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <Button onClick={handleAddSingle} disabled={loading || !singleUrl}>
                  {loading ? 'Adding...' : 'Add URL'}
                </Button>
              </TabsContent>

              <TabsContent value="bulk" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk">URLs (one per line)</Label>
                  <textarea
                    id="bulk"
                    placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                    value={bulkUrls}
                    onChange={(e) => setBulkUrls(e.target.value)}
                    className="w-full h-64 px-3 py-2 border rounded-md"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter one URL per line. Maximum 1000 URLs at a time.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 text-green-600 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <Button onClick={handleAddBulk} disabled={loading || !bulkUrls}>
                  {loading ? 'Adding...' : 'Add URLs'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
