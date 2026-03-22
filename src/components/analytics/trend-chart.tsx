'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'

interface TrendDataPoint {
  date: string
  indexed: number
  notIndexed: number
  discovered: number
  errors: number
}

interface TrendChartProps {
  data: TrendDataPoint[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return format(d, 'MMM d')
}

export function TrendChart({ data }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        No trend data available yet. Start monitoring URLs to see trends.
      </div>
    )
  }

  const formatted = data.map(d => ({ ...d, label: formatDate(d.date) }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="indexed"
          name="Indexed"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="notIndexed"
          name="Not Indexed"
          stroke="#dc2626"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="discovered"
          name="Discovered"
          stroke="#d97706"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="errors"
          name="Errors"
          stroke="#9333ea"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
