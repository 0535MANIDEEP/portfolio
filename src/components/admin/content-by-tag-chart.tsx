'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'

interface ContentByTagChartProps {
  blogs: { tags: string }[]
  snippets: { tags: string }[]
}

const TAG_COLORS = [
  '#3b82f6', '#a855f7', '#22c55e', '#f97316', '#ec4899',
  '#06b6d4', '#eab308', '#ef4444', '#8b5cf6', '#14b8a6',
  '#f43f5e', '#84cc16', '#0ea5e9', '#d946ef', '#facc15',
]

function parseTags(tags: string | undefined | null): string[] {
  if (!tags) return []
  return tags
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * ContentByTagChart — horizontal bar chart showing the top content tags
 * across blogs and snippets. Helps the admin see which topics are most covered.
 */
export function ContentByTagChart({ blogs, snippets }: ContentByTagChartProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>()

    for (const b of blogs) {
      for (const t of parseTags(b.tags)) {
        counts.set(t, (counts.get(t) || 0) + 1)
      }
    }
    for (const s of snippets) {
      for (const t of parseTags(s.tags)) {
        counts.set(t, (counts.get(t) || 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // top 10 tags
  }, [blogs, snippets])

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="text-3xl mb-2">🏷️</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">No tags yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add tags to blogs and snippets to see distribution</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.3} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} stroke="var(--border)" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="tag"
          tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
          stroke="var(--border)"
          width={90}
        />
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
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={TAG_COLORS[index % TAG_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
