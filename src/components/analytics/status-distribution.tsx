'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface StatusDistributionProps {
  indexed: number
  notIndexed: number
  discovered: number
  errors: number
}

const COLORS = {
  indexed: '#16a34a',
  notIndexed: '#dc2626',
  discovered: '#d97706',
  errors: '#9333ea',
}

export function StatusDistribution({ indexed, notIndexed, discovered, errors }: StatusDistributionProps) {
  const data = [
    { name: 'Indexed', value: indexed, color: COLORS.indexed },
    { name: 'Not Indexed', value: notIndexed, color: COLORS.notIndexed },
    { name: 'Discovered', value: discovered, color: COLORS.discovered },
    { name: 'Errors', value: errors, color: COLORS.errors },
  ].filter(d => d.value > 0)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
