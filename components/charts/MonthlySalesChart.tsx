"use client"

import React from 'react'
import { ChartContainer } from '@/components/ui/chart'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
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

function aggregateByMonth(items: any[]) {
  const salesTotals = new Array(12).fill(0)
  const profitTotals = new Array(12).fill(0)

  items.forEach((it) => {
    // try common date fields
    const dateStr = it.date || it.sellingDate || it.paymentReceivingDate || it.createdAt
    const d = dateStr ? new Date(dateStr?.toDate ? dateStr.toDate() : String(dateStr)) : null
    if (d instanceof Date && !isNaN(d.getTime())) {
      const m = d.getMonth()
      const amount = toNumber(it.amount ?? it.sellingPrice ?? it.total ?? 0)
      // profit may be explicit or derivable from sellingPrice - stoneCost
      let profit = 0
      if (it.myProfit !== undefined) profit = toNumber(it.myProfit)
      else if (it.sellingPrice !== undefined && it.stoneCost !== undefined) profit = toNumber(it.sellingPrice) - toNumber(it.stoneCost)
      else profit = toNumber(it.profit ?? 0)

      salesTotals[m] += amount
      profitTotals[m] += profit
    }
  })

  return monthNames.map((m, i) => ({ month: m, sales: salesTotals[i], profit: profitTotals[i] }))
}

export default function MonthlySalesChart({ initialData, data: dataProp }: MonthlySalesChartProps) {
  const initial = dataProp || initialData || null
  const [data, setData] = useState<{ month: string; sales: number; profit?: number }[] | null>(initial)
  const [loading, setLoading] = useState(initial ? false : true)

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const candidates = ['sales', 'archives', 'remainders']
  
    // We'll read from the `remainders` collection where sellingPrice is stored
    const colRef = collection(db, 'remainders')

    // attach realtime listener for remainders
    let unsub: (() => void) | undefined

    async function attach() {
      try {
        const snap = await getDocs(colRef)
        if (!mounted) return
        // Attach listener even if empty so we get live updates
        unsub = onSnapshot(colRef, (s) => {
          if (!mounted) return
          const items = s.docs.map((d) => ({ id: d.id, ...d.data() }))
          setData(aggregateByMonth(items))
          setLoading(false)
        })
        // If initial snapshot was not empty, seed immediately
        if (!snap.empty) {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          setData(aggregateByMonth(items))
          setLoading(false)
        }
      } catch (err) {
        // fallback: show zeros
        if (mounted) {
          setData(monthNames.map((m) => ({ month: m, sales: 0, profit: 0 })))
          setLoading(false)
        }
      }
    }

    attach()

    return () => {
      mounted = false
      if (unsub) unsub()
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
      config={{ sales: { label: 'Sales', color: '#34D399' }, profit: { label: 'Profit', color: '#F472B6' } }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
          <Tooltip formatter={(value: any) => (typeof value === 'number' ? value.toLocaleString() : value)} />
          <Legend formatter={(value) => <span className="text-sm text-gray-300">{value}</span>} />
          <Area type="monotone" dataKey="sales" stroke="#34D399" fill="#34D39922" />
          <Area type="monotone" dataKey="profit" stroke="#F472B6" fill="#F472B622" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
