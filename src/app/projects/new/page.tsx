'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().url('Must be a valid URL'),
  searchConsoleProperty: z.string().min(1, 'Search Console property is required'),
})

type ProjectFormData = z.infer<typeof projectSchema>

export default function NewProject() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const onSubmit = async (data: ProjectFormData) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to create project')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Set up a new project to monitor URLs from your Search Console property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="My Website"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  placeholder="https://example.com"
                  {...register('domain')}
                />
                {errors.domain && (
                  <p className="text-sm text-red-600">{errors.domain.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchConsoleProperty">
                  Search Console Property
                </Label>
                <Input
                  id="searchConsoleProperty"
                  placeholder="sc-domain:example.com or https://example.com/"
                  {...register('searchConsoleProperty')}
                />
                <p className="text-xs text-muted-foreground">
                  The property URL from your Google Search Console
                </p>
                {errors.searchConsoleProperty && (
                  <p className="text-sm text-red-600">
                    {errors.searchConsoleProperty.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
