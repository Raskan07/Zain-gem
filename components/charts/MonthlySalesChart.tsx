"use client"

import React from 'react'
import { ChartContainer } from '@/components/ui/chart'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, onSnapshot } from 'firebase/firestore'

type MonthlySalesChartProps = {
  // optional initial data override (allow profit optional)
  initialData?: { month: string; sales: number; profit?: number }[]
  // legacy/alternate prop name used in some pages
  data?: { month: string; sales: number; profit?: number }[]
}

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function toNumber(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/**
 * Combine three sources into monthly buckets:
 * - salesTotals: sum of sellingPrice grouped by sellingDate from remainders+archives
 * - profitTotals: sum of myProfit grouped by sellingDate from remainders+archives
 * - investTotals: sum of stone cost grouped by a stone date (createdAt / purchasedAt / addedAt)
 */
function aggregateMonthly(remItems: any[], arcItems: any[], stoneItems: any[]) {
  const salesTotals = new Array(12).fill(0)
  const profitTotals = new Array(12).fill(0)
  const investTotals = new Array(12).fill(0)

  const pushSale = (doc: any) => {
    const sd = doc.sellingDate
    if (!sd) return
    const d = sd?.toDate ? sd.toDate() : new Date(String(sd))
    if (!(d instanceof Date) || isNaN(d.getTime())) return
    const m = d.getMonth()
    salesTotals[m] += toNumber(doc.sellingPrice ?? doc.amount ?? 0)
    profitTotals[m] += toNumber(doc.myProfit ?? 0)
  }

  remItems.forEach(pushSale)
  arcItems.forEach(pushSale)

  // stones: attempt to find a suitable date field and compute cost
  stoneItems.forEach((s) => {
    const dateField = s.purchaseDate || s.createdAt || s.addedAt || s.addedOn
    if (!dateField) return
    const d = dateField?.toDate ? dateField.toDate() : new Date(String(dateField))
    if (!(d instanceof Date) || isNaN(d.getTime())) return
    const m = d.getMonth()
    const totalCost = toNumber(s.totalCost) || (toNumber(s.stoneCost) + toNumber(s.cuttingCost) + toNumber(s.polishCost) + toNumber(s.treatmentCost) + toNumber(s.otherCost))
    investTotals[m] += totalCost
  })

  return monthNames.map((m, i) => ({ month: m, sales: salesTotals[i], profit: profitTotals[i], investment: investTotals[i] }))
}

export default function MonthlySalesChart({ initialData, data: dataProp }: MonthlySalesChartProps) {
  const initial = dataProp || initialData || null
  const [data, setData] = useState<{ month: string; sales: number; profit?: number }[] | null>(initial)
  const [loading, setLoading] = useState(initial ? false : true)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const remRef = collection(db, 'remainders')
    const arcRef = collection(db, 'archives')
    const stonesRef = collection(db, 'stones')

    let remUnsub: (() => void) | undefined
    let arcUnsub: (() => void) | undefined
    let stonesUnsub: (() => void) | undefined

    const computeAndSet = (remSnapDocs: any[], arcSnapDocs: any[], stoneSnapDocs: any[]) => {
      if (!mounted) return
      const remItems = remSnapDocs.map((d: any) => ({ id: d.id, ...d.data() }))
      const arcItems = arcSnapDocs.map((d: any) => ({ id: d.id, ...d.data() }))
      const stoneItems = stoneSnapDocs.map((d: any) => ({ id: d.id, ...d.data() }))
      const agg = aggregateMonthly(remItems, arcItems, stoneItems)
      setData(agg)
      setLoading(false)
    }

    // local caches of docs
    let remCache: any[] = []
    let arcCache: any[] = []
    let stonesCache: any[] = []

    remUnsub = onSnapshot(remRef, (s) => {
      remCache = s.docs
      computeAndSet(remCache, arcCache, stonesCache)
    }, (err) => console.error('reminders snapshot error', err))

    arcUnsub = onSnapshot(arcRef, (s) => {
      arcCache = s.docs
      computeAndSet(remCache, arcCache, stonesCache)
    }, (err) => console.error('archives snapshot error', err))

    stonesUnsub = onSnapshot(stonesRef, (s) => {
      stonesCache = s.docs
      computeAndSet(remCache, arcCache, stonesCache)
    }, (err) => console.error('stones snapshot error', err))

  // initial fetch fallback: getDocs for each and compute quickly
  ;(async () => {
      try {
        const [rSnap, aSnap, sSnap] = await Promise.all([getDocs(remRef), getDocs(arcRef), getDocs(stonesRef)])
        if (!mounted) return
        remCache = rSnap.docs
        arcCache = aSnap.docs
        stonesCache = sSnap.docs
        computeAndSet(remCache, arcCache, stonesCache)
      } catch (err) {
        if (mounted) {
          setData(monthNames.map((m) => ({ month: m, sales: 0, profit: 0, investment: 0 })))
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
      if (remUnsub) remUnsub()
      if (arcUnsub) arcUnsub()
      if (stonesUnsub) stonesUnsub()
    }
  }, [])

  if (loading || !data) {
    // simple skeleton: three animated bars
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex items-end gap-2 h-24">
          <div className="w-4 bg-white/10 rounded animate-pulse" style={{ height: 48 }} />
          <div className="w-4 bg-white/10 rounded animate-pulse" style={{ height: 64 }} />
          <div className="w-4 bg-white/10 rounded animate-pulse" style={{ height: 36 }} />
        </div>
      </div>
    )
  }

  return (
    <ChartContainer
      id="monthly-sales"
      className="w-full h-full"
      config={{ sales: { label: 'Sales', color: '#34D399' }, profit: { label: 'Profit', color: '#F472B6' }, investment: { label: 'Investment', color: '#60A5FA' } }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <Tooltip formatter={(value: any) => (typeof value === 'number' ? value.toLocaleString() : value)} />
          <Legend formatter={(value) => <span className="text-sm text-gray-300">{value}</span>} />
          <Bar dataKey="sales" name="Sales" fill="#34D399" />
          <Bar dataKey="profit" name="Profit/Loss" fill="#F472B6" />
          <Bar dataKey="investment" name="Investment" fill="#60A5FA" />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
