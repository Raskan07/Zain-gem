import { Timestamp } from 'firebase/firestore'

export type DateRange = 'this-week' | 'this-month' | 'custom'
export type StatusFilter = 'all' | 'upcoming' | 'overdue' | 'completed'

export interface DateRangeFilter {
  start: Date
  end: Date
}

export function getDateRangeFromType(type: DateRange): DateRangeFilter {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (type) {
    case 'this-week':
      start.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
      end.setDate(start.getDate() + 6) // End of week (Saturday)
      break
    case 'this-month':
      start.setDate(1) // Start of month
      end.setMonth(now.getMonth() + 1)
      end.setDate(0) // End of month
      break
    case 'custom':
      // Handle custom date range in component
      break
  }

  // Set time to start/end of day
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

export function getStatus(dueDate: Date | null): 'upcoming' | 'due-soon' | 'overdue' {
  if (!dueDate) return 'upcoming'

  const now = new Date()
  const diff = dueDate.getTime() - now.getTime()
  const daysUntilDue = diff / (1000 * 60 * 60 * 24)

  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue <= 2) return 'due-soon'
  return 'upcoming'
}

export function parseDateField(v: any): Date | null {
  if (!v) return null
  try {
    if (v instanceof Timestamp) return v.toDate()
    if (v?.toDate) return v.toDate()
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

export const statusColors = {
  'upcoming': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  'due-soon': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  'overdue': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  'completed': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' }
}