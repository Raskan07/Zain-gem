   import { useState } from 'react'
import { ArchiveReportDocument, generateAndDownloadPDF } from './ReportTemplates'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { FileDown } from 'lucide-react'

export function ArchiveExportOptions({
  data,
    isLoading
}: {
  data: {
    dateRange: { from: string; to: string }
    archives: Array<{
      title: string
      archivedDate: Date
      originalDueDate?: Date | null
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
        totalCount: data.archives.length,
        archives: data.archives,
        summary: {
          paid: data.archives.filter(a => a.status === 'paid').length,
          pending: data.archives.filter(a => a.status === 'pending').length,
          overdue: data.archives.filter(a => a.status === 'overdue').length,
        }
      }

      const document = (
        <ArchiveReportDocument data={documentData} />
      )

      await generateAndDownloadPDF(
        document,
        `archives-report-${new Date().toISOString().split('T')[0]}.pdf`
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
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="min-w-[150px] backdrop-blur-md bg-white/10 border border-white/20"
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