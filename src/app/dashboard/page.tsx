'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, AlertCircle, Globe, Plus } from 'lucide-react'

interface Project {
  id: string
  name: string
  domain: string
  _count: {
    urls: number
  }
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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetchProjects()
    }
  }, [session])

  useEffect(() => {
    if (selectedProject) {
      fetchStats(selectedProject.id)
    }
  }, [selectedProject])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
        if (data.length > 0) {
          setSelectedProject(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stats`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Indexing Insight</CardTitle>
              <CardDescription>
                Get started by creating your first project to monitor Google indexing status
              </CardDescription>
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
              <p className="text-sm text-gray-600 mt-1">
                {selectedProject?.name || 'Select a project'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value)
                  if (project) setSelectedProject(project)
                }}
                className="px-3 py-2 border rounded-md"
              >
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <Button onClick={() => router.push('/projects/new')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total URLs"
              value={stats.totalUrls}
              icon={Globe}
              variant="default"
            />
            <StatsCard
              title="Indexed"
              value={`${stats.indexedUrls} (${stats.indexedPercentage}%)`}
              icon={CheckCircle}
              change={stats.change24h}
              changeLabel="in 24h"
              variant="success"
            />
            <StatsCard
              title="Not Indexed"
              value={stats.notIndexedUrls}
              icon={XCircle}
              variant="warning"
            />
            <StatsCard
              title="Errors"
              value={stats.urlsWithErrors}
              icon={AlertCircle}
              variant="error"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your URLs and monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/projects/${selectedProject?.id}/urls`)}
              >
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest indexing changes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats?.change7d || 0} URLs changed status in the last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
