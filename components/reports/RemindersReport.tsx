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

interface Reminder {
  id: string
  title: string
  description?: string
  dueDate: Date | null
  category?: string
  status: string
  assignedTo?: string
  createdAt: Date
}

export default function RemindersReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  
  // Filters
  const [dateRange, setDateRange] = useState<ReportDateRange>('this-month')
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  })
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  
  // Load reminders
  useEffect(() => {
    async function loadReminders() {
      setLoading(true)
      setError(null)
      try {
        const snap = await getDocs(
          query(
            collection(db, 'remainders'),
            orderBy('dueDate', 'asc')
          )
        )
        const docs = snap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            title: data.title || data.stoneName || 'Untitled',
            status: data.status || 'unknown',
            ...data,
            dueDate: parseDateField(data.dueDate),
            createdAt: parseDateField(data.createdAt) || new Date(),
          } as Reminder
        })
        setReminders(docs)
      } catch (err) {
        console.error('Error loading reminders:', err)
        setError('Failed to load reminders')
      } finally {
        setLoading(false)
      }
    }
    
    loadReminders()
  }, [])

  // Filter reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(reminder => {
      // Date range filter
      if (dateRange === 'custom') {
        if (!customDateRange?.from || !customDateRange?.to) return true
        const date = reminder.dueDate || reminder.createdAt
        return date >= customDateRange.from && date <= customDateRange.to
      } else {
        const range = getDateRangeFromType(dateRange)
        const date = reminder.dueDate || reminder.createdAt
        if (!range.start || !range.end) return true
        return date >= range.start && date <= range.end
      }
    }).filter(reminder => {
      // Status filter
      if (statusFilter === 'all') return true
      const status = getStatus(reminder.dueDate)
      if (statusFilter === 'completed' && reminder.status === 'completed') return true
      return status === statusFilter
    })
  }, [reminders, dateRange, customDateRange, statusFilter])

  // Export handlers
  function exportToPDF() {
    // TODO: Implement PDF export using @react-pdf/renderer
    console.log('Export to PDF')
  }

  function exportToCSV() {
    const headers = ['Title', 'Description', 'Due Date', 'Status', 'Category', 'Assigned To']
    const rows = filteredReminders.map(r => [
      r.title,
      r.description || '',
      r.dueDate ? format(r.dueDate, 'PPP') : '',
      getStatus(r.dueDate),
      r.category || '',
      r.assignedTo || ''
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reminders-${format(new Date(), 'yyyy-MM-dd')}.csv`
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
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="due-soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
            Showing {filteredReminders.length} reminders
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReminders.map((reminder) => {
                  const status = getStatus(reminder.dueDate)
                  const colors = statusColors[status]
                  
                  return (
                    <TableRow key={reminder.id}>
                      <TableCell className="font-medium">{reminder.title}</TableCell>
                      <TableCell>
                        {reminder.dueDate ? format(reminder.dueDate, 'PPP') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${colors.bg} ${colors.text} border ${colors.border}`}
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>{reminder.category || '—'}</TableCell>
                      <TableCell>{reminder.assignedTo || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            // Card View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReminders.map((reminder) => {
                const status = getStatus(reminder.dueDate)
                const colors = statusColors[status]
                
                return (
                  <Card key={reminder.id}>
                    <CardHeader>
                      <CardTitle>{reminder.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-500">Due Date</div>
                            <div>{reminder.dueDate ? format(reminder.dueDate, 'PPP') : '—'}</div>
                          </div>
                          <Badge 
                            className={`${colors.bg} ${colors.text} border ${colors.border}`}
                          >
                            {status}
                          </Badge>
                        </div>
                        {reminder.description && (
                          <div>
                            <div className="text-sm text-gray-500">Description</div>
                            <div className="text-sm">{reminder.description}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-sm text-gray-500">Category</div>
                            <div className="text-sm">{reminder.category || '—'}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Assigned To</div>
                            <div className="text-sm">{reminder.assignedTo || '—'}</div>
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