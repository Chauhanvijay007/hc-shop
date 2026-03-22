'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Globe, BarChart2, Activity, Bell, Filter, ChevronLeft } from 'lucide-react'

interface ProjectNavProps {
  projectId: string
  projectName?: string
  domain?: string
}

const NAV_ITEMS = [
  { label: 'URLs', path: 'urls', icon: Globe },
  { label: 'Analytics', path: 'analytics', icon: BarChart2 },
  { label: 'Crawl Budget', path: 'crawl-analysis', icon: Activity },
  { label: 'Alerts', path: 'alerts', icon: Bell },
  { label: 'Filters', path: 'filters', icon: Filter },
]

export function ProjectNav({ projectId, projectName, domain }: ProjectNavProps) {
  const router = useRouter()
  const pathname = usePathname()

  function isActive(path: string) {
    return pathname.includes(`/projects/${projectId}/${path}`)
  }

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex items-center justify-between h-14 border-b border-gray-100">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </button>
          {(projectName || domain) && (
            <div className="text-right">
              {projectName && <p className="text-sm font-medium leading-tight">{projectName}</p>}
              {domain && <p className="text-xs text-muted-foreground">{domain}</p>}
            </div>
          )}
        </div>

        {/* Tab row */}
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => router.push(`/projects/${projectId}/${item.path}`)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
