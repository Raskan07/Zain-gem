import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf
} from '@react-pdf/renderer'
import { format } from 'date-fns'

// Register default font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.cdnfonts.com/s/29267/Helvetica.woff', fontWeight: 'normal' },
    { src: 'https://fonts.cdnfonts.com/s/29267/Helvetica-Bold.woff', fontWeight: 'bold' },
  ]
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 14,
    marginBottom: 15,
    color: '#666666',
  },
  section: {
    margin: 10,
    padding: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginVertical: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    padding: 15,
    marginBottom: 20,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    color: '#666666',
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  status: {
    padding: 4,
    borderRadius: 4,
    fontSize: 9,
    textAlign: 'center',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusPaid: {
    backgroundColor: '#DEF7EC',
    color: '#03543F',
  },
  statusOverdue: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 8,
  },
})

// Helpers
function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case 'pending':
      return styles.statusPending
    case 'paid':
      return styles.statusPaid
    case 'overdue':
      return styles.statusOverdue
    default:
      return {}
  }
}

// Reminder Report PDF Document
export function ReminderReportDocument({ data }: {
  data: {
    dateRange: string
    totalCount: number
    reminders: Array<{
      title: string
      dueDate: Date | null
      status: string
      category?: string
      assignedTo?: string
    }>
    summary: {
      pending: number
      paid: number
      overdue: number
    }
  }
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Reminders Report</Text>
        <Text style={styles.subHeader}>{data.dateRange}</Text>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Reminders:</Text>
            <Text style={styles.summaryValue}>{data.totalCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>{data.summary.pending}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid:</Text>
            <Text style={styles.summaryValue}>{data.summary.paid}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Overdue:</Text>
            <Text style={styles.summaryValue}>{data.summary.overdue}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Title</Text>
            <Text style={styles.tableCell}>Due Date</Text>
            <Text style={styles.tableCell}>Status</Text>
            <Text style={styles.tableCell}>Category</Text>
            <Text style={styles.tableCell}>Assigned To</Text>
          </View>
          
          {data.reminders.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.title}</Text>
              <Text style={styles.tableCell}>
                {item.dueDate ? format(item.dueDate, 'MMM dd, yyyy') : '—'}
              </Text>
              <View style={[styles.tableCell, { alignItems: 'center' }]}>
                <Text style={[styles.status, getStatusStyle(item.status)]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.tableCell}>{item.category || '—'}</Text>
              <Text style={styles.tableCell}>{item.assignedTo || '—'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm')}
        </Text>
      </Page>
    </Document>
  )
}

// Archive Report PDF Document
export function ArchiveReportDocument({ data }: {
  data: {
    dateRange: string
    totalCount: number
    archives: Array<{
      title: string
      archivedDate: Date
      originalDueDate?: Date | null
      status: string
      category?: string
      assignedTo?: string
      completedDate?: Date | null
    }>
    summary: {
      pending: number
      paid: number
      overdue: number
    }
  }
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Archives Report</Text>
        <Text style={styles.subHeader}>{data.dateRange}</Text>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Archives:</Text>
            <Text style={styles.summaryValue}>{data.totalCount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>{data.summary.pending}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid:</Text>
            <Text style={styles.summaryValue}>{data.summary.paid}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Overdue:</Text>
            <Text style={styles.summaryValue}>{data.summary.overdue}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Title</Text>
            <Text style={styles.tableCell}>Archived Date</Text>
            <Text style={styles.tableCell}>Original Due</Text>
            <Text style={styles.tableCell}>Status</Text>
            <Text style={styles.tableCell}>Category</Text>
          </View>
          
          {data.archives.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.title}</Text>
              <Text style={styles.tableCell}>
                {format(item.archivedDate, 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.tableCell}>
                {item.originalDueDate ? format(item.originalDueDate, 'MMM dd, yyyy') : '—'}
              </Text>
              <View style={[styles.tableCell, { alignItems: 'center' }]}>
                <Text style={[styles.status, getStatusStyle(item.status)]}>
                  {item.status}
                </Text>
              </View>
              <Text style={styles.tableCell}>{item.category || '—'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm')}
        </Text>
      </Page>
    </Document>
  )
}

// Helper function to generate and download PDF
export async function generateAndDownloadPDF(doc: React.ReactElement<any>, filename: string) {
  try {
    // Create the PDF with a slight delay to ensure fonts are loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    const instance = pdf(doc);
    const blob = await instance.toBlob();
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a')
    link.href = url
    link.download = filename
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw error
  }
}