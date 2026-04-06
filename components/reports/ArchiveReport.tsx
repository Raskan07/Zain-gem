"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { DateRange } from "react-day-picker"
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DateRange as ReportDateRange, StatusFilter, getDateRangeFromType, getStatus, parseDateField, statusColors } from '@/lib/report-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
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
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Archive, CalendarIcon, Download, Loader2, Printer, Search, FileText } from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface Remainder {
  id: string;
  stoneName: string;
  stoneWeight: number;
  stoneCost: number;
  sellingPrice: number;
  myProfit: number;
  partyReceives: number;
  sellingDate: Date;
  paymentReceivingDate: Date;
  durationInDays: number;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
  receiptImage?: string;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export default function ArchiveReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [archives, setArchives] = useState<Remainder[]>([])
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [buyerTypeFilter, setBuyerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  
  const [showPrintReport, setShowPrintReport] = useState(false);
  
  // Load archives
  useEffect(() => {
    async function loadArchives() {
      setLoading(true)
      setError(null)
      try {
        const snap = await getDocs(
          query(
            collection(db, 'archives'),
            orderBy('archivedAt', 'desc')
          )
        )
        const docs = snap.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            sellingDate: parseDateField(data.sellingDate) || new Date(),
            paymentReceivingDate: parseDateField(data.paymentReceivingDate) || new Date(),
            createdAt: parseDateField(data.createdAt) || new Date(),
            updatedAt: parseDateField(data.updatedAt) || new Date(),
            archivedAt: parseDateField(data.archivedAt) || new Date(),
          } as Remainder
        })
        setArchives(docs)
      } catch (err) {
        console.error('Error loading archives:', err)
        setError('Failed to load archives')
      } finally {
        setLoading(false)
      }
    }
    
    loadArchives()
  }, [])

  // Filter Logic
  const filteredArchives = useMemo(() => {
    return archives.filter((item) => {
      // Free text search (Stone Variety / Owner Name)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchesStone = item.stoneName.toLowerCase().includes(queryLower);
        const matchesOwner = item.ownerName?.toLowerCase().includes(queryLower);
        if (!matchesStone && !matchesOwner) {
          return false;
        }
      }
      // Date Range Filter
      if (dateFrom && item.archivedAt) {
        if (item.archivedAt < startOfDay(dateFrom)) return false;
      }
      if (dateTo && item.archivedAt) {
        if (item.archivedAt > endOfDay(dateTo)) return false;
      }
      // Select Filters
      if (buyerTypeFilter !== "all" && item.buyerType !== buyerTypeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (ownerFilter !== "all" && item.stoneOwner !== ownerFilter) return false;

      return true;
    });
  }, [archives, searchQuery, dateFrom, dateTo, buyerTypeFilter, statusFilter, ownerFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setBuyerTypeFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
  };

  // Analytics Calculations
  const totalSellingPrice = useMemo(() => filteredArchives.reduce((acc, curr) => acc + curr.sellingPrice, 0), [filteredArchives]);
  const totalProfit = useMemo(() => filteredArchives.reduce((acc, curr) => acc + (curr.myProfit || 0), 0), [filteredArchives]);
  const avgDuration = useMemo(() => {
    if (filteredArchives.length === 0) return 0;
    const totalDays = filteredArchives.reduce((acc, curr) => acc + curr.durationInDays, 0);
    return Math.round(totalDays / filteredArchives.length);
  }, [filteredArchives]);
  
  // Export handlers
  function exportToCSV() {
    const csvData = filteredArchives.map(r => ({
      'Stone Name': r.stoneName,
      'Stone Weight': r.stoneWeight,
      'Stone Cost': r.stoneCost,
      'Selling Price': r.sellingPrice,
      'My Profit': r.myProfit,
      'Party Receives': r.partyReceives,
      'Selling Date': format(r.sellingDate, 'yyyy-MM-dd'),
      'Payment Due Date': format(r.paymentReceivingDate, 'yyyy-MM-dd'),
      'Duration (Days)': r.durationInDays,
      'Stone Owner': r.stoneOwner,
      'Owner Name': r.ownerName || '-',
      'Buyer Type': r.buyerType,
      'Buyer Name': r.buyerName || '-',
      'Status': r.status,
      'Archived At': r.archivedAt ? format(r.archivedAt, 'yyyy-MM-dd') : '-'
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify((row as any)[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `archives-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const ReportTemplate = () => (
    <div className="bg-white text-black p-8 font-sans print:m-0 print:p-0 print:w-full" id="printable-report">
      <h1 className="text-[28px] font-bold text-slate-900 mb-2 tracking-tight">Archives Report</h1>
      <p className="text-base text-slate-500 mb-8">
        {dateFrom ? format(dateFrom, 'yyyy-MM-dd') : 'Any'} - {dateTo ? format(dateTo, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
      </p>

      <div className="bg-slate-50 p-6 rounded-lg mb-8 max-w-[320px]">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Total Archives:</span>
          <span className="font-bold text-slate-900 text-[15px]">{filteredArchives.length}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Pending:</span>
          <span className="font-bold text-slate-900 text-[15px]">{filteredArchives.filter(a => a.status === 'pending').length}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Paid:</span>
          <span className="font-bold text-slate-900 text-[15px]">{filteredArchives.filter(a => a.status === 'paid').length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-[15px]">Overdue:</span>
          <span className="font-bold text-slate-900 text-[15px]">{filteredArchives.filter(a => a.status === 'overdue').length}</span>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border border-slate-200">
            <th className="p-3 text-left font-bold text-slate-900 w-[20%]">Title</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Archived Date</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Original Due</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Status</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Category</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[20%]">Owner Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredArchives.map((arc) => (
            <tr key={arc.id} className="border border-slate-200">
              <td className="p-3 text-[15px] text-slate-800">{arc.stoneName}</td>
              <td className="p-3 text-[15px] text-slate-800">{arc.archivedAt ? format(arc.archivedAt, 'MMM dd, yyyy') : '-'}</td>
              <td className="p-3 text-[15px] text-slate-800">{format(arc.paymentReceivingDate, 'MMM dd, yyyy')}</td>
              <td className="p-3 text-[15px]">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  arc.status === 'paid' ? 'bg-emerald-100/50 text-emerald-800' :
                  arc.status === 'overdue' ? 'bg-red-100/50 text-red-800' :
                  'bg-orange-100/50 text-orange-800'
                }`}>
                  {arc.status}
                </span>
              </td>
              <td className="p-3 text-[15px] text-slate-800">{arc.buyerType}</td>
              <td className="p-3 text-[15px] text-slate-800">{arc.ownerName || '-'}</td>
            </tr>
          ))}
          {filteredArchives.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 border border-slate-200 text-center text-slate-500">No records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 rounded">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <Archive className="h-5 w-5 text-indigo-400" />
           Archives Report
         </h2>
         <div className="flex gap-2">
            <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-9">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
         </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="lg:col-span-2 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
           <Input 
             placeholder="Search Stone Variety or Owner Name..." 
             className="pl-9 bg-black/40 border-white/10 text-white h-9 rounded-lg"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/10 h-9 rounded-lg ${!dateFrom && "text-muted-foreground"}`}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd, yyyy") : <span>Date From</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-white/10 bg-slate-900 text-white" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/10 h-9 rounded-lg ${!dateTo && "text-muted-foreground"}`}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd, yyyy") : <span>Date To</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-white/10 bg-slate-900 text-white" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
          </PopoverContent>
        </Popover>

        <Select value={buyerTypeFilter} onValueChange={setBuyerTypeFilter}>
          <SelectTrigger className="bg-black/40 border-white/10 text-white h-9 rounded-lg">
            <SelectValue placeholder="Buyer" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">All Buyers</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="chinese">Chinese</SelectItem>
          </SelectContent>
        </Select>

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="bg-black/40 border-white/10 text-white h-9 rounded-lg">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-white/10 text-white">
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="me">Direct Stock</SelectItem>
            <SelectItem value="others">Third Party</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : (
        <>
          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Filtered Count</p>
                 <p className="text-xl font-bold text-white">{filteredArchives.length}</p>
               </div>
            </div>
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-[10px] uppercase font-bold text-indigo-300/80 mb-1">Total Selling</p>
                 <p className="text-xl font-bold text-white">Rs. {totalSellingPrice.toLocaleString()}</p>
               </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-[10px] uppercase font-bold text-green-300/80 mb-1">Total Profit</p>
                 <p className="text-xl font-bold text-green-400">Rs. {totalProfit.toLocaleString()}</p>
               </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
               <div>
                 <p className="text-[10px] uppercase font-bold text-amber-300/80 mb-1">Avg Duration</p>
                 <p className="text-xl font-bold text-amber-400">{avgDuration} d</p>
               </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-black/40">
                   <TableRow className="border-white/5">
                     <TableHead className="text-indigo-300 font-bold">Stone Title</TableHead>
                     <TableHead className="text-indigo-300 font-bold">Archived Date</TableHead>
                     <TableHead className="text-indigo-300 font-bold">Buyer Type</TableHead>
                     <TableHead className="text-indigo-300 font-bold">Owner Name</TableHead>
                     <TableHead className="text-indigo-300 font-bold">Status</TableHead>
                     <TableHead className="text-indigo-300 font-bold text-right">Selling Price</TableHead>
                     <TableHead className="text-indigo-300 font-bold text-right">Profit</TableHead>
                     <TableHead className="text-indigo-300 font-bold text-right">Duration</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredArchives.map((archive) => (
                     <TableRow key={archive.id} className="border-white/5 hover:bg-white/5">
                        <TableCell className="font-bold text-white">{archive.stoneName}</TableCell>
                        <TableCell className="text-white/70">{archive.archivedAt ? format(archive.archivedAt, 'PPP') : '-'}</TableCell>
                        <TableCell className="text-white/70 capitalize">{archive.buyerType}</TableCell>
                        <TableCell className="text-white/70">{archive.ownerName || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            archive.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                            archive.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {archive.status.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-white">{archive.sellingPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-green-400">{archive.myProfit?.toLocaleString() || '0'}</TableCell>
                        <TableCell className="text-right text-white/50">{archive.durationInDays}d</TableCell>
                     </TableRow>
                   ))}
                   {filteredArchives.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={8} className="text-center text-white/40 py-8">
                         No records found
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
                 {filteredArchives.length > 0 && (
                   <TableFooter className="bg-black/60 border-t border-white/10 border-b-0">
                     <TableRow className="hover:bg-transparent">
                       <TableCell colSpan={5} className="text-right text-indigo-300 font-bold">TOTALS:</TableCell>
                       <TableCell className="text-right font-mono font-bold text-white">{totalSellingPrice.toLocaleString()}</TableCell>
                       <TableCell className="text-right font-mono font-bold text-green-400">{totalProfit.toLocaleString()}</TableCell>
                       <TableCell className="text-right text-white/50">-</TableCell>
                     </TableRow>
                   </TableFooter>
                 )}
               </Table>
             </div>
          </div>
        </>
      )}

      {/* Hidden Printable Report */}
      <div className="hidden print:block w-full">
         <ReportTemplate />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background-color: white; }
        }
      `}} />
    </div>
  )
}