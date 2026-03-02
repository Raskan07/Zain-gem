import { useState } from 'react'
import { ReminderReportDocument, generateAndDownloadPDF } from './ReportTemplates'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { FileDown } from 'lucide-react'

// Add PDF export to your existing report component
export function ExportOptions({
  data,
  onExportCSV,
  isLoading
}: {
  data: {
    dateRange: { from: string; to: string }
    reminders: Array<{
      title: string
      dueDate: Date | null
      status: 'pending' | 'paid' | 'overdue'
      category?: string
      assignedTo?: string
    }>
  }
  onExportCSV: () => void
  isLoading: boolean
}) {
  const handleExportPDF = async () => {
    try {
      const dateRange = `${data.dateRange.from} - ${data.dateRange.to}`
      const documentData = {
        dateRange,
        totalCount: data.reminders.length,
        reminders: data.reminders,
        summary: {
          pending: data.reminders.filter(r => r.status === 'pending').length,
          paid: data.reminders.filter(r => r.status === 'paid').length,
          overdue: data.reminders.filter(r => r.status === 'overdue').length
        }
      }

      const document = (
        <ReminderReportDocument data={documentData} />
      )

      await generateAndDownloadPDF(
        document,
        `reminders-report-${new Date().toISOString().split('T')[0]}.pdf`
      )
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      // Handle error (show toast notification, etc.)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isLoading}
          className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="min-w-[150px] backdrop-blur-md bg-white/10 border border-white/20 text-white shadow-2xl"
        align="end"
      >
        <DropdownMenuItem 
          onClick={onExportCSV}
          className="text-white hover:bg-white/20 cursor-pointer"
        >
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportPDF}
          className="text-white hover:bg-white/20 cursor-pointer"
        >
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}