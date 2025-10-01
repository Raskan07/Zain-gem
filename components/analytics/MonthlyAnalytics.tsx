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
import { Calendar, DollarSign, TrendingUp, Layers, Edit, Download, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

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
  const [imageModalSrc, setImageModalSrc] = useState<string | null>(null)
  const [editingStone, setEditingStone] = useState<DocAny | null>(null)

  // Track available years (current year - 3 to current year)
  const years = useMemo(() => {
    const currentYear = now.getFullYear()
    return [currentYear - 3, currentYear - 2, currentYear - 1, currentYear]
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
        // prefer explicit duration if provided in the sale doc
        const explicit = toNumber(sdDoc.durationInDays ?? sdDoc.duration)
        if (explicit && explicit > 0) {
          durations.push(explicit)
          fastMoving.push({ ...sdDoc, boughtDate, soldDate, days: explicit })
        } else {
          const diffDays = Math.max(0, Math.round((soldDate.getTime() - boughtDate.getTime()) / (1000*60*60*24)))
          durations.push(diffDays)
          fastMoving.push({ ...sdDoc, boughtDate, soldDate, days: diffDays })
        }
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

  // helper UI actions
  function openImageModal(src: string) {
    setImageModalSrc(src)
  }
  function closeImageModal() {
    setImageModalSrc(null)
  }

  function getStatusBadge(status: string | undefined) {
    const s = (status || 'unknown').toString().toLowerCase()
    if (s === 'sold') return <Badge className="bg-green-600 text-white">Sold</Badge>
    if (s === 'available') return <Badge className="bg-blue-600 text-white">Available</Badge>
    if (s === 'reserved') return <Badge className="bg-yellow-600 text-black">Reserved</Badge>
    return <Badge className="bg-gray-600 text-white">{String(status ?? 'N/A')}</Badge>
  }

  function getProfitLossDisplay(v: any) {
    const n = toNumber(v)
    const fmt = `LKR ${Math.abs(n).toLocaleString()}`
    if (n > 0) return <span className="text-green-300">+{fmt}</span>
    if (n < 0) return <span className="text-red-300">-{fmt}</span>
    return <span className="text-gray-200">{fmt}</span>
  }

  function openStoneReport(stone: DocAny) {
    try {
      const data = JSON.stringify(stone, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `stone-${stone.id || stone.customId || 'report'}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to create report', err)
    }
  }

  function handleDeleteStone(id: string) {
    if (!confirm('Delete this stone from the client view? This will only remove it locally in the UI.')) return
    // soft-remove from local state to avoid accidental destructive operations
    setStonesDocs(prev => prev.filter(s => s.id !== id))
    // optionally: call Firestore delete with proper confirmation in a separate flow
    console.log('Stone removed locally:', id)
  }

  function formatPartyOrStone(sale: any) {
    const pr = toNumber(sale.partyReceives ?? sale.partyAmount ?? sale.party)
    const sc = toNumber(sale.stoneCost)
    if (pr && pr !== 0) return `LKR ${pr.toLocaleString()}`
    if (sc && sc !== 0) return `LKR ${sc.toLocaleString()}`
    return '—'
  }

  function getPaymentBadge(doc: any) {
    // possible fields: paymentStatus, status, isPaid, paid, payment?.status
    const status = (doc.paymentStatus ?? doc.status ?? (doc.payment && doc.payment.status) ?? (doc.isPaid ? 'paid' : undefined) ?? (doc.paid ? 'paid' : undefined))
    const s = String(status ?? '').toLowerCase()
    if (s === 'paid' || s === 'complete' || s === 'completed') return <Badge className="bg-green-600 text-white">Paid</Badge>
    if (s === 'overdue') return <Badge className="bg-red-600 text-white">Overdue</Badge>
    if (s === 'pending' || s === '') return <Badge className="bg-yellow-500 text-black">Pending</Badge>
    return <Badge className="bg-gray-600 text-white">{String(status)}</Badge>
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
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 bg-white/5 text-white p-2 rounded">
                    <Calendar className="size-4 opacity-80" />
                    <span>{monthNames[selectedMonth]} {selectedYear}</span>
                  </button>
                  <button
                    onClick={() => setMonthPickerOpen(true)}
                    className="text-sm text-gray-300 flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5"
                    aria-haspopup="dialog"
                    aria-expanded={monthPickerOpen}
                  >
                    <span>Showing:</span>
                    <span className="font-medium">{monthNames[selectedMonth]} {selectedYear}</span>
                  </button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-3">
                <div className="space-y-3">
                  {/* Year selector */}
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={selectedYear <= Math.min(...years)}
                      onClick={() => setSelectedYear(y => y - 1)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold">{selectedYear}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={selectedYear >= Math.max(...years)}
                      onClick={() => setSelectedYear(y => y + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((month, idx) => {
                      const isSelected = selectedMonth === idx && selectedYear === now.getFullYear()
                      const isCurrent = idx === now.getMonth() && selectedYear === now.getFullYear()

                      return (
                        <Button
                          key={month}
                          variant={isSelected ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => {
                            setSelectedMonth(idx)
                            setMonthPickerOpen(false)
                          }}
                          className={`h-9 ${isCurrent && !isSelected ? 'border border-primary' : ''}`}
                        >
                          {month}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <label className="text-sm text-gray-300 flex items-center gap-2"><input type="checkbox" checked={comparePrev} onChange={(e)=>setComparePrev(e.target.checked)} /> Compare to previous</label>
          </div>
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

      <div className="flex-col  flex  gap-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Stones Sold ({selectedAgg.stonesSold.length})</h3>
          <Table>
            <TableHeader>
              <TableRow className="backdrop-blur-sm bg-white/10">
                <TableHead className="text-white px-4 py-3">Name</TableHead>
                <TableHead className="text-white px-4 py-3">Weight (ct)</TableHead>
                <TableHead className="text-white px-4 py-3">Stone Cost / Party Receives</TableHead>
                <TableHead className="text-white px-4 py-3">Selling Price</TableHead>
                <TableHead className="text-white px-4 py-3">Selling Date</TableHead>
                <TableHead className="text-white px-4 py-3">Duration (days)</TableHead>
                <TableHead className="text-white px-4 py-3">Stone Ownership</TableHead>
                <TableHead className="text-white px-4 py-3">My Profit / Loss</TableHead>
                <TableHead className="text-white px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedAgg.stonesSold.map((s: any) => {
                // derive fields from sale doc (remainders/archives)
                const name = s.stoneName || s.name || s.title || s.id
                const weight = s.weight ?? s.weightInRough ?? s.stoneWeight ?? '—'
                const partyReceives = (s.partyReceives ?? s.partyAmount ?? s.party) ?? s.stoneCost ?? null
                const sellingDate = parseDateField(s.sellingDate) || null

                // compute duration: prefer durationInDays from the sale doc, otherwise try to compute
                let daysHeld: number | null = null
                const explicitDays = toNumber(s.durationInDays ?? s.duration)
                if (explicitDays && explicitDays > 0) {
                  daysHeld = explicitDays
                } else {
                  try {
                    const stoneId = s.stoneId || s.stoneRef || s.stone
                    let boughtDate: Date | null = null
                    if (stoneId) {
                      const found = stonesDocs.find((st: any) => (st.id === stoneId) || (st.customId === stoneId) || (String(st.customIdNum) === String(stoneId)))
                      if (found) boughtDate = parseDateField(found.purchaseDate || found.createdAt || found.addedAt || found.addedOn)
                    }
                    if (!boughtDate) boughtDate = parseDateField(s.createdAt) || parseDateField(s.addedAt) || null
                    if (boughtDate && sellingDate) {
                      daysHeld = Math.max(0, Math.round((sellingDate.getTime() - boughtDate.getTime()) / (1000*60*60*24)))
                    }
                  } catch (err) {
                    daysHeld = null
                  }
                }

                const ownership = s.ownership || s.stoneOwner || s.owner || s.partyName || (s.isBorrowed ? 'Borrowed' : 'Mine') || 'Unknown'
                const profit = s.myProfit ?? s.profitLoss ?? s.profit ?? 0

                return (
                  <TableRow key={s.id} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell className="text-white px-4 py-3">{name}</TableCell>
                    <TableCell className="text-white px-4 py-3">{weight} ct</TableCell>
                    <TableCell className="text-white px-4 py-3">{formatPartyOrStone(s)}</TableCell>
                    <TableCell className="text-white px-4 py-3">LKR {toNumber(s.sellingPrice).toLocaleString()}</TableCell>
                    <TableCell className="text-white px-4 py-3">{sellingDate ? sellingDate.toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-white px-4 py-3">{daysHeld != null ? daysHeld : '—'}</TableCell>
                    <TableCell className="text-white px-4 py-3">{ownership}</TableCell>
                    <TableCell className="text-white px-4 py-3">{getProfitLossDisplay(profit)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingStone(s)} className="text-white hover:bg-white/10"><Edit className="h-3 w-3"/></Button>
                          <Button variant="ghost" size="sm" onClick={() => openStoneReport(s)} className="text-white hover:bg-white/10"><Download className="h-3 w-3"/></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteStone(s.id)} className="text-white hover:bg-white/10"><Trash2 className="h-3 w-3"/></Button>
                        </div>
                        <div className="ml-2">{getPaymentBadge(s)}</div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Stones Bought ({selectedAgg.stonesBought.length})</h3>
          <Table>
            <TableHeader>
              <TableRow className="backdrop-blur-sm bg-white/10">
                <TableHead className="text-white px-4 py-3">ID</TableHead>
                <TableHead className="text-white px-4 py-3">Name</TableHead>
                <TableHead className="text-white px-4 py-3">Images</TableHead>
                <TableHead className="text-white px-4 py-3">Weight</TableHead>
                <TableHead className="text-white px-4 py-3">Cost</TableHead>
                <TableHead className="text-white px-4 py-3">Date</TableHead>
                <TableHead className="text-white px-4 py-3">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedAgg.stonesBought.map((s: any) => (
                <TableRow key={s.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell className="text-white font-mono text-sm px-4 py-3">{s.customId ?? s.id}</TableCell>
                  <TableCell className="text-white font-medium px-4 py-3">{s.name || s.stoneName || s.title}</TableCell>
                  <TableCell className="px-4 py-3">
                    {s.images && s.images.length > 0 ? (
                      <div className="flex gap-1">
                        {s.images.slice(0,3).map((img:string, idx:number) => (
                          <img key={idx} src={img} alt={`img-${idx}`} className="w-8 h-8 object-cover rounded cursor-pointer" onClick={()=>openImageModal(img)} />
                        ))}
                        {s.images.length > 3 && <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">+{s.images.length - 3}</div>}
                      </div>
                    ) : <span className="text-white/40 text-sm">No images</span>}
                  </TableCell>
                  <TableCell className="text-white px-4 py-3">{s.weight ?? '—'} ct</TableCell>
                  <TableCell className="text-white px-4 py-3">LKR {toNumber(s.cost).toLocaleString()}</TableCell>
                  <TableCell className="text-white px-4 py-3">{(s.date || new Date()).toLocaleDateString()}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={()=>setEditingStone(s)} className="text-white hover:bg-white/10"><Edit className="h-3 w-3"/></Button>
                      <Button variant="ghost" size="sm" onClick={()=>openStoneReport(s)} className="text-white hover:bg-white/10"><Download className="h-3 w-3"/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          
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
