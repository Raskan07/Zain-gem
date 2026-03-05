"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { DateRange } from "react-day-picker"
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DateRange as ReportDateRange, StatusFilter, getDateRangeFromType, getStatus, parseDateField, statusColors } from '@/lib/report-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ArchiveItem {
  id: string
  title: string
  description?: string
  archivedDate: Date
  category?: string
  status: string
  originalDueDate?: Date
  assignedTo?: string
  completedDate?: Date
}

export default function ArchiveReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archives, setArchives] = useState<ArchiveItem[]>([])
  
  // Filters
  const [dateRange, setDateRange] = useState<ReportDateRange>('this-month')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  // Load archives
  useEffect(() => {
    async function loadArchives() {
      setLoading(true)
      setError(null)
      try {
        const snap = await getDocs(
          query(
            collection(db, 'archives'),
            orderBy('archivedDate', 'desc')
          )
        )
        const docs = snap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || 'Untitled',
            status: data.status || 'unknown',
            ...data,
            archivedDate: parseDateField(data.archivedDate) || new Date(),
            originalDueDate: parseDateField(data.originalDueDate) || undefined,
            completedDate: parseDateField(data.completedDate) || undefined,
          } as ArchiveItem
        })
        setArchives(docs)
      } catch (err) {
        console.error('Error loading archives:', err)
        setError('Failed to load archives')
      } finally {
        setLoading(false)
      }
    }
    
    loadArchives()
  }, [])

  // Filter archives
  const filteredArchives = useMemo(() => {
    return archives.filter(archive => {
      // Date range filter
      if (dateRange === 'custom') {
        if (!customDateRange?.from || !customDateRange?.to) return true
        const date = archive.archivedDate
        return date >= customDateRange.from && date <= customDateRange.to
      } else {
        const range = getDateRangeFromType(dateRange)
        const date = archive.archivedDate
        if (!range.start || !range.end) return true
        return date >= range.start && date <= range.end
      }
    }).filter(archive => {
      // Status filter
      if (statusFilter === 'all') return true
      if (statusFilter === 'completed' && archive.completedDate) return true
      return archive.status?.toLowerCase() === statusFilter
    })
  }, [archives, dateRange, customDateRange, statusFilter])

  // Export handlers
  function exportToPDF() {
    // TODO: Implement PDF export using @react-pdf/renderer
    console.log('Export to PDF')
  }

  function exportToCSV() {
    const headers = ['Title', 'Description', 'Archived Date', 'Original Due Date', 'Status', 'Category', 'Assigned To']
    const rows = filteredArchives.map(a => [
      a.title,
      a.description || '',
      format(a.archivedDate, 'PPP'),
      a.originalDueDate ? format(a.originalDueDate, 'PPP') : '',
      a.status || '',
      a.category || '',
      a.assignedTo || ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `archives-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap bg-white/5 p-4 rounded-lg">
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as ReportDateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {dateRange === 'custom' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customDateRange?.from ? (
                  customDateRange.to ? (
                    <>
                      {format(customDateRange.from, 'LLL dd, y')} -{' '}
                      {format(customDateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(customDateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={customDateRange}
                onSelect={setCustomDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(v => v === 'table' ? 'cards' : 'table')}
          >
            {viewMode === 'table' ? 'Card View' : 'Table View'}
          </Button>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Results Count */}
          <div className="text-sm text-gray-500">
            Showing {filteredArchives.length} archived items
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead>Original Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArchives.map((archive) => {
                  const statusColor = archive.status?.toLowerCase() === 'completed'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                  
                  return (
                    <TableRow key={archive.id}>
                      <TableCell className="font-medium">{archive.title}</TableCell>
                      <TableCell>{format(archive.archivedDate, 'PPP')}</TableCell>
                      <TableCell>
                        {archive.originalDueDate ? format(archive.originalDueDate, 'PPP') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor}>
                          {archive.status || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>{archive.category || '—'}</TableCell>
                      <TableCell>{archive.assignedTo || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArchives.map((archive) => {
                const statusColor = archive.status?.toLowerCase() === 'completed'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
                
                return (
                  <Card key={archive.id}>
                    <CardHeader>
                      <CardTitle>{archive.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Archived Date</div>
                            <div>{format(archive.archivedDate, 'PPP')}</div>
                          </div>
                          <Badge className={statusColor}>
                            {archive.status || 'Unknown'}
                          </Badge>
                        </div>
                        {archive.description && (
                          <div>
                            <div className="text-sm text-gray-500">Description</div>
                            <div className="text-sm">{archive.description}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm text-gray-500">Original Due Date</div>
                            <div className="text-sm">
                              {archive.originalDueDate ? format(archive.originalDueDate, 'PPP') : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Completed Date</div>
                            <div className="text-sm">
                              {archive.completedDate ? format(archive.completedDate, 'PPP') : '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Category</div>
                            <div className="text-sm">{archive.category || '—'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Assigned To</div>
                            <div className="text-sm">{archive.assignedTo || '—'}</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}