'use client'

import { useState } from 'react'
import { Download, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportDataProps {
  /** Filename without extension */
  filename: string
  /** Data to export */
  data: unknown
  /** Label for the trigger button */
  label?: string
}

/**
 * ExportData — dropdown button that exports the provided data as JSON or CSV.
 * JSON: pretty-printed. CSV: flattened (first-level keys only, arrays joined with |).
 */
export function ExportData({ filename, data, label = 'Export' }: ExportDataProps) {
  const [state, setState] = useState<'idle' | 'done'>('idle')

  const download = (content: string, mime: string, ext: string) => {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.${ext}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setState('done')
    setTimeout(() => setState('idle'), 2000)
  }

  const exportJSON = () => {
    download(JSON.stringify(data, null, 2), 'application/json', 'json')
  }

  const exportCSV = () => {
    const arr = Array.isArray(data) ? data : [data]
    if (arr.length === 0) {
      download('No data', 'text/csv', 'csv')
      return
    }
    // Collect all unique keys from all objects
    const keys = new Set<string>()
    for (const item of arr) {
      if (item && typeof item === 'object') {
        for (const k of Object.keys(item as Record<string, unknown>)) {
          keys.add(k)
        }
      }
    }
    const headers = Array.from(keys)
    const escape = (val: unknown) => {
      if (val === null || val === undefined) return ''
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val)
      // Flatten arrays with pipe
      if (Array.isArray(val)) str = val.join('|')
      // Escape quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`
      }
      return str
    }
    const csv = [
      headers.join(','),
      ...arr.map(item =>
        headers.map(h => escape((item as Record<string, unknown>)?.[h])).join(',')
      ),
    ].join('\n')
    download(csv, 'text/csv', 'csv')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          {state === 'done' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Download className="h-3.5 w-3.5" />}
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportJSON}>
          <Download className="h-3.5 w-3.5 mr-2" /> Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-2" /> Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
