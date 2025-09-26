"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import SummaryCard from '@/components/sub-componets/SummaryCard'
import { ChartContainer } from '@/components/ui/chart'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from '@/components/ui/command'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Calendar, DollarSign, TrendingUp, Layers } from 'lucide-react'

type DocAny = { [k: string]: any }

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function toNumber(v: any) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function parseDateField(v: any): Date | null {
  if (!v) return null
  try {
    if (v?.toDate) return v.toDate()
    const d = new Date(String(v))
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`
}

export default function MonthlyAnalytics() {
  const now = new Date()
  const [loading, setLoading] = useState(true)
  const [remDocs, setRemDocs] = useState<DocAny[]>([])
  const [arcDocs, setArcDocs] = useState<DocAny[]>([])
  const [stonesDocs, setStonesDocs] = useState<DocAny[]>([])

  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [comparePrev, setComparePrev] = useState(true)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)

  // build list of month options (last 36 months)
  const monthOptions = useMemo(() => {
    const opts: { key: string; label: string; month: number; year: number }[] = []
    const total = 36
    for (let i = 0; i < total; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth()
      const y = d.getFullYear()
      opts.push({ key: `${y}-${String(m).padStart(2, '0')}`, label: `${monthNames[m]} ${y}`, month: m, year: y })
    }
    return opts
  }, [now])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    async function load() {
      try {
        const [rSnap, aSnap, sSnap] = await Promise.all([
          getDocs(collection(db, 'remainders')),
          getDocs(collection(db, 'archives')),
          getDocs(collection(db, 'stones')),
        ])
        if (!mounted) return
        setRemDocs(rSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setArcDocs(aSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setStonesDocs(sSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Error loading analytics docs', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  // build items to consider for sales/profit: archives + remainders
  const salesItems = useMemo(() => [...remDocs, ...arcDocs], [remDocs, arcDocs])

  function aggregateFor(month: number, year: number) {
    const monthSales = { totalSales: 0, totalProfit: 0, stonesSold: [] as DocAny[] }

    salesItems.forEach((doc) => {
      const sd = parseDateField(doc.sellingDate)
      if (!sd) return
      if (sd.getMonth() === month && sd.getFullYear() === year) {
        monthSales.totalSales += toNumber(doc.sellingPrice)
        monthSales.totalProfit += toNumber(doc.myProfit)
        monthSales.stonesSold.push({ ...doc, sellingDate: sd })
      }
    })

    // investment: stones bought/added in that month
    const stonesBought: DocAny[] = []
    let totalInvestment = 0
    stonesDocs.forEach((s) => {
      const d = parseDateField(s.purchaseDate || s.createdAt || s.addedAt || s.addedOn)
      if (!d) return
      if (d.getMonth() === month && d.getFullYear() === year) {
        const cost = toNumber(s.totalCost) || (toNumber(s.stoneCost) + toNumber(s.cuttingCost) + toNumber(s.polishCost) + toNumber(s.treatmentCost) + toNumber(s.otherCost))
        totalInvestment += cost
        stonesBought.push({ ...s, date: d, cost })
      }
    })

    // compute durations: for sold stones that have a reference to a stone id (if available), or use createdAt -> sellingDate
    const durations: number[] = [] // days held
    const fastMoving: DocAny[] = []
    monthSales.stonesSold.forEach((sdDoc) => {
      // try to find corresponding stone by id
      const stoneId = sdDoc.stoneId || sdDoc.stoneRef || sdDoc.stone
      let boughtDate: Date | null = null
      if (stoneId) {
        const found = stonesDocs.find(s => (s.id === stoneId) || (s.customId === stoneId) || (s.customIdNum && String(s.customIdNum) === String(stoneId)))
        if (found) boughtDate = parseDateField(found.purchaseDate || found.createdAt || found.addedAt || found.addedOn)
      }
      if (!boughtDate) {
        // fallback to createdAt in sale doc
        boughtDate = parseDateField(sdDoc.createdAt) || parseDateField(sdDoc.addedAt) || null
      }
      const soldDate = parseDateField(sdDoc.sellingDate)
      if (boughtDate && soldDate) {
        const diffDays = Math.max(0, Math.round((soldDate.getTime() - boughtDate.getTime()) / (1000*60*60*24)))
        durations.push(diffDays)
        fastMoving.push({ ...sdDoc, boughtDate, soldDate, days: diffDays })
      }
    })

    const avgHolding = durations.length ? Math.round(durations.reduce((a,b) => a+b,0) / durations.length) : 0
    fastMoving.sort((a,b) => (a.days ?? 0) - (b.days ?? 0))

    return {
      totalSales: monthSales.totalSales,
      totalProfit: monthSales.totalProfit,
      totalInvestment,
      stonesSold: monthSales.stonesSold,
      stonesBought,
      avgHoldingDays: avgHolding,
      fastMoving: fastMoving.slice(0,5),
    }
  }

  const selectedAgg = useMemo(() => aggregateFor(selectedMonth, selectedYear), [selectedMonth, selectedYear, salesItems, stonesDocs])
  const prevDate = useMemo(() => {
    const d = new Date(selectedYear, selectedMonth, 1)
    d.setMonth(d.getMonth() - 1)
    return { month: d.getMonth(), year: d.getFullYear() }
  }, [selectedMonth, selectedYear])
  const prevAgg = useMemo(() => aggregateFor(prevDate.month, prevDate.year), [prevDate, salesItems, stonesDocs])

  if (loading) return <div className="p-4 text-gray-300">Loading analytics…</div>

  // prepare small chart data for comparison
  const compareData = [
    { metric: 'Sales', selected: selectedAgg.totalSales, previous: prevAgg.totalSales },
    { metric: 'Profit', selected: selectedAgg.totalProfit, previous: prevAgg.totalProfit },
    { metric: 'Investment', selected: selectedAgg.totalInvestment, previous: prevAgg.totalInvestment },
    { metric: 'Stones Sold', selected: selectedAgg.stonesSold.length, previous: prevAgg.stonesSold.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 bg-white/5 text-white p-2 rounded">
                  <Calendar className="size-4 opacity-80" />
                  <span>{monthNames[selectedMonth]} {selectedYear}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <Command>
                  <CommandInput placeholder="Search month..." />
                  <CommandList>
                    {monthOptions.map((opt) => (
                      <CommandItem
                        key={opt.key}
                        onSelect={() => {
                          setSelectedMonth(opt.month)
                          setSelectedYear(opt.year)
                          setMonthPickerOpen(false)
                        }}
                      >
                        {opt.label}
                      </CommandItem>
                    ))}
                    <CommandEmpty>No months found.</CommandEmpty>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            <label className="text-sm text-gray-300 flex items-center gap-2"><input type="checkbox" checked={comparePrev} onChange={(e)=>setComparePrev(e.target.checked)} /> Compare to previous</label>
          </div>
        <div className="text-sm text-gray-300">Showing: {monthNames[selectedMonth]} {selectedYear}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={<DollarSign className="size-5" />} title="Total Sales" value={<><span className="text-sm font-medium">LKR</span> {selectedAgg.totalSales.toLocaleString()}</>} />
        <SummaryCard icon={<TrendingUp className="size-5" />} title="Profit / Loss" value={<><span className="text-sm font-medium">LKR</span> {selectedAgg.totalProfit.toLocaleString()}</>} />
        <SummaryCard icon={<Layers className="size-5" />} title="Investment" value={<><span className="text-sm font-medium">LKR</span> {selectedAgg.totalInvestment.toLocaleString()}</>} />
        <SummaryCard icon={<Calendar className="size-5" />} title="Stones Sold" value={<>{selectedAgg.stonesSold.length}</>} />
      </div>

      {comparePrev && (
        <CardContainer title={`Comparison: ${monthNames[selectedMonth]} ${selectedYear} vs ${monthNames[prevDate.month]} ${prevDate.year}`}>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="metric" tick={{ fill: 'rgba(255,255,255,0.8)' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.8)' }} />
                <Tooltip formatter={(v:any) => (typeof v === 'number' ? v.toLocaleString() : v)} />
                <Legend formatter={(v) => <span className="text-sm text-gray-300">{v}</span>} />
                <Bar dataKey="previous" name="Previous" fill="#94A3B8" />
                <Bar dataKey="selected" name="Selected" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContainer>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Stones Sold ({selectedAgg.stonesSold.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sold Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Selling Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedAgg.stonesSold.map((s:any) => (
                <TableRow key={s.id} className="border-t border-white/6">
                  <TableCell className="py-2">{s.stoneName || s.name || s.title || s.id}</TableCell>
                  <TableCell className="py-2">{toNumber(s.sellingPrice).toLocaleString()}</TableCell>
                  <TableCell className="py-2">{toNumber(s.myProfit).toLocaleString()}</TableCell>
                  <TableCell className="py-2">{(parseDateField(s.sellingDate) || new Date()).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Stones Bought ({selectedAgg.stonesBought.length})</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedAgg.stonesBought.map((s:any) => (
                <TableRow key={s.id} className="border-t border-white/6">
                  <TableCell className="py-2">{s.name || s.stoneName || s.id}</TableCell>
                  <TableCell className="py-2">{toNumber(s.cost).toLocaleString()}</TableCell>
                  <TableCell className="py-2">{(s.date || new Date()).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4">
            <h4 className="text-sm text-gray-300">Average holding period: <span className="text-white">{selectedAgg.avgHoldingDays} days</span></h4>
            <h4 className="text-sm text-gray-300 mt-2">Fast moving stones:</h4>
            <ul className="list-disc ml-5 text-sm text-gray-200 mt-1">
              {selectedAgg.fastMoving.map((f:any) => (
                <li key={f.id}>{f.stoneName || f.name || f.id} — {f.days} days</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function CardContainer({ title, children }: { title?: string, children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-lg text-white">
      {title && <div className="text-sm text-gray-300 mb-2">{title}</div>}
      {children}
    </div>
  )
}
