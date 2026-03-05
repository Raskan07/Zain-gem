"use client"

import React from 'react'
import { PDFViewer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

// PDF styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    border: '1px solid #cccccc',
    borderRadius: 5,
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333333',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
    color: '#666666',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#cccccc',
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    textAlign: 'center',
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    padding: 5,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    height: 200,
    marginVertical: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#999999',
    fontSize: 10,
  }
})

type ReportData = {
  month: string
  year: number
  totalSales: number
  totalProfit: number
  totalInvestment: number
  stonesSold: any[]
  stonesBought: any[]
  avgHoldingDays: number
  compareData: any[]
  prevMonth: string
  prevYear: number
}

// PDF Document Component
const MonthlyReportDocument = ({ data }: { data: ReportData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <Text style={styles.header}>Monthly Analytics Report</Text>
      <Text style={styles.subHeader}>{data.month} {data.year}</Text>

      {/* Summary Metrics */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>Summary</Text>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Sales:</Text>
          <Text style={styles.metricValue}>LKR {data.totalSales.toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Profit:</Text>
          <Text style={styles.metricValue}>LKR {data.totalProfit.toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Total Investment:</Text>
          <Text style={styles.metricValue}>LKR {data.totalInvestment.toLocaleString()}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Stones Sold:</Text>
          <Text style={styles.metricValue}>{data.stonesSold.length}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Average Holding Days:</Text>
          <Text style={styles.metricValue}>{data.avgHoldingDays}</Text>
        </View>
      </View>

      {/* Comparison with Previous Month */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>Comparison with {data.prevMonth} {data.prevYear}</Text>
        {data.compareData.map((item, idx) => (
          <View key={idx} style={styles.metric}>
            <Text style={styles.metricLabel}>{item.metric}:</Text>
            <Text style={styles.metricValue}>
              Current: {typeof item.selected === 'number' ? item.selected.toLocaleString() : item.selected}
              {'\n'}
              Previous: {typeof item.previous === 'number' ? item.previous.toLocaleString() : item.previous}
              {'\n'}
              Change: {((item.selected - item.previous) / (item.previous || 1) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Stones Sold Table */}
      <View style={styles.section}>
        <Text style={styles.subHeader}>Stones Sold Details</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Name</Text>
            <Text style={styles.tableCell}>Weight</Text>
            <Text style={styles.tableCell}>Selling Price</Text>
            <Text style={styles.tableCell}>Profit/Loss</Text>
          </View>
          {data.stonesSold.map((stone, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.tableCell}>{stone.name || stone.stoneName || stone.id}</Text>
              <Text style={styles.tableCell}>{stone.weight || '—'} ct</Text>
              <Text style={styles.tableCell}>LKR {stone.sellingPrice?.toLocaleString() || '—'}</Text>
              <Text style={styles.tableCell}>LKR {stone.myProfit?.toLocaleString() || '—'}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Generated on {new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
)

export interface MonthlyReportProps {
  isOpen: boolean
  onClose: () => void
  data: ReportData
}

export default function MonthlyReport({ isOpen, onClose, data }: MonthlyReportProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] p-4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <PDFViewer style={{ width: '100%', height: '100%' }}>
          <MonthlyReportDocument data={data} />
        </PDFViewer>
      </div>
    </div>
  )
}