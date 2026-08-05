'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'

interface ContentDistributionChartProps {
  stats: { label: string; value: number }[]
}

const COLORS: Record<string, string> = {
  Blogs: '#3b82f6',
  Projects: '#a855f7',
  Courses: '#22c55e',
  Snippets: '#f97316',
  Messages: '#ec4899',
  Logs: '#06b6d4',
}

/**
 * ContentDistributionChart — donut chart showing content counts by type.
 * Uses recharts PieChart with inner radius for donut effect.
 */
export function ContentDistributionChart({ stats }: ContentDistributionChartProps) {
  const data = useMemo(() => {
    return stats
      .filter(s => s.value > 0)
      .map(s => ({
        name: s.label,
        value: s.value,
        color: COLORS[s.label] || '#64748b',
      }))
  }, [stats])

  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-2">🥧</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">No content yet</p>
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
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--popover-foreground)',
          }}
          formatter={(value: number) => [`${value} item${value !== 1 ? 's' : ''}`, 'Count']}
        />
        <Legend
          wrapperStyle={{ fontSize: '11px' }}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
