'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'

interface ActivityChartProps {
  logs: { action: string; createdAt: string }[]
}

const ACTION_COLORS: Record<string, string> = {
  create: '#22c55e',
  'blog.create': '#22c55e',
  'project.create': '#22c55e',
  update: '#3b82f6',
  'blog.update': '#3b82f6',
  'project.update': '#3b82f6',
  delete: '#ef4444',
  'blog.delete': '#ef4444',
  'project.delete': '#ef4444',
  login: '#a855f7',
  'login_success': '#a855f7',
  error: '#f97316',
}

function getCategorize(action: string): 'create' | 'update' | 'delete' | 'other' {
  const a = action.toLowerCase()
  if (a.includes('create')) return 'create'
  if (a.includes('update') || a.includes('login')) return 'update'
  if (a.includes('delete') || a.includes('error')) return 'delete'
  return 'other'
}

/**
 * ActivityChart — 7-day area chart of admin operations grouped by action category.
 * Uses recharts (already installed). Renders in the admin dashboard.
 */
export function ActivityChart({ logs }: ActivityChartProps) {
  const chartData = useMemo(() => {
    const days: { date: string; label: string; create: number; update: number; delete: number; other: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      days.push({
        date: key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        create: 0,
        update: 0,
        delete: 0,
        other: 0,
      })
    }

    const dayMap = new Map(days.map(d => [d.date, d]))

    for (const log of logs) {
      const d = new Date(log.createdAt)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      const day = dayMap.get(key)
      if (!day) continue
      const cat = getCategorize(log.action)
      day[cat]++
    }

    return days
  }, [logs])

  const hasData = chartData.some(d => d.create + d.update + d.delete + d.other > 0)

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">No activity in the last 7 days</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Actions will appear here as you manage content</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCreate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUpdate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDelete" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} stroke="var(--border)" />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} stroke="var(--border)" allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'var(--popover-foreground)',
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="create" stroke="#22c55e" fillOpacity={1} fill="url(#colorCreate)" name="Create" />
        <Area type="monotone" dataKey="update" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUpdate)" name="Update" />
        <Area type="monotone" dataKey="delete" stroke="#ef4444" fillOpacity={1} fill="url(#colorDelete)" name="Delete" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
