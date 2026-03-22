'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ProjectNav } from '@/components/layout/project-nav'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ALERT_TYPE_LABELS: Record<string, string> = {
  url_dropped: 'URL Dropped from Index',
  url_indexed: 'URL Newly Indexed',
  error_detected: 'Error Detected',
  bulk_drop: 'Bulk Index Drop',
  not_indexed_duration: 'Not Indexed for Duration',
  specific_error: 'Specific Error Type',
}

const ALERT_TYPE_DESCRIPTIONS: Record<string, string> = {
  url_dropped: 'Fires when a URL loses its indexed status',
  url_indexed: 'Fires when a URL becomes indexed for the first time',
  error_detected: 'Fires when a coverage error is detected',
  bulk_drop: 'Fires when many URLs drop from index at once',
  not_indexed_duration: 'Fires when a URL stays not-indexed for too long',
  specific_error: 'Fires on a specific coverage error type',
}

interface Alert {
  id: string
  alertType: string
  isActive: boolean
  createdAt: string
  triggerCondition: Record<string, unknown> | null
  _count: { alertHistory: number }
  name?: string
  description?: string
}

interface CreateForm {
  name: string
  description: string
  alertType: string
}

const EMPTY_FORM: CreateForm = { name: '', description: '', alertType: 'url_dropped' }

export default function AlertsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => { fetchAlerts() }, [projectId])

  async function fetchAlerts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts`)
      if (res.ok) setAlerts(await res.json())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function createAlert() {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const alert = await res.json()
        setAlerts(prev => [alert, ...prev])
        setShowCreate(false)
        setForm(EMPTY_FORM)
      } else {
        setError('Failed to create alert')
      }
    } catch (e) {
      setError('Failed to create alert')
    } finally {
      setSaving(false)
    }
  }

  async function toggleAlert(alert: Alert) {
    setTogglingId(alert.id)
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive }),
      })
      if (res.ok) {
        setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isActive: !a.isActive } : a))
      }
    } catch (e) { console.error(e) }
    finally { setTogglingId(null) }
  }

  async function deleteAlert(id: string) {
    if (!confirm('Delete this alert?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/projects/${projectId}/alerts/${id}`, { method: 'DELETE' })
      if (res.ok) setAlerts(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
    finally { setDeletingId(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectNav projectId={projectId} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Alerts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Get notified when indexing status changes</p>
          </div>
          <Button onClick={() => { setShowCreate(true); setError('') }}>
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>

        {/* Create Alert Panel */}
        {showCreate && (
          <Card className="border-blue-200 bg-blue-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Create New Alert</CardTitle>
                <button onClick={() => { setShowCreate(false); setError('') }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-gray-900" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="alert-name">Name</Label>
                  <Input
                    id="alert-name"
                    placeholder="e.g. Homepage drop alert"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <select
                    id="alert-type"
                    value={form.alertType}
                    onChange={e => setForm(f => ({ ...f, alertType: e.target.value }))}
                    className="w-full h-10 border rounded-md px-3 text-sm bg-white"
                  >
                    {Object.entries(ALERT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alert-desc">Description (optional)</Label>
                <Input
                  id="alert-desc"
                  placeholder="What should this alert watch for?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {form.alertType && (
                <p className="text-xs text-muted-foreground bg-white rounded border px-3 py-2">
                  {ALERT_TYPE_DESCRIPTIONS[form.alertType]}
                </p>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={createAlert} disabled={saving}>
                  {saving ? 'Creating…' : 'Create Alert'}
                </Button>
                <Button variant="outline" onClick={() => { setShowCreate(false); setError('') }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-gray-300 mb-3" />
              <h3 className="font-medium text-gray-900 mb-1">No alerts yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first alert to get notified when indexing status changes.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Alert
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <Card key={alert.id} className={alert.isActive ? '' : 'opacity-60'}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg mt-0.5 ${alert.isActive ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm">{alert.name || ALERT_TYPE_LABELS[alert.alertType]}</h3>
                        <Badge variant={alert.isActive ? 'success' : 'outline'} className="text-xs">
                          {alert.isActive ? 'Active' : 'Paused'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {ALERT_TYPE_LABELS[alert.alertType] || alert.alertType}
                        </Badge>
                      </div>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert._count.alertHistory} triggered · Created {formatDate(alert.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleAlert(alert)}
                        disabled={togglingId === alert.id}
                        title={alert.isActive ? 'Pause alert' : 'Activate alert'}
                        className="text-muted-foreground hover:text-gray-900 disabled:opacity-50 transition-colors"
                      >
                        {alert.isActive
                          ? <ToggleRight className="h-5 w-5 text-blue-500" />
                          : <ToggleLeft className="h-5 w-5" />
                        }
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        disabled={deletingId === alert.id}
                        title="Delete alert"
                        className="text-muted-foreground hover:text-red-600 disabled:opacity-50 transition-colors"
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

        {/* Type Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Alert Types Reference</CardTitle>
            <CardDescription>Available alert types and what triggers them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(ALERT_TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{ALERT_TYPE_DESCRIPTIONS[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
