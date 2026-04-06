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
import { CalendarIcon, Download, Loader2, Printer, Search, FileText, Bell } from 'lucide-react'
import { format, isWithinInterval, startOfDay, endOfDay, differenceInDays } from 'date-fns'
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
}

export default function RemindersReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reminders, setReminders] = useState<Remainder[]>([])
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [buyerTypeFilter, setBuyerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  
  const [showPrintReport, setShowPrintReport] = useState(false);
  
  // Helper to re-calculate current status dynamically
  const getCurrentStatus = (paymentDate: Date, originalStatus: string) => {
    if (originalStatus === "paid") return "paid";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pDate = new Date(paymentDate);
    pDate.setHours(0, 0, 0, 0);
    const daysRemaining = differenceInDays(pDate, today);
    return daysRemaining < 0 ? "overdue" : "pending";
  };

  // Load active reminders
  useEffect(() => {
    async function loadReminders() {
      setLoading(true)
      setError(null)
      try {
        const snap = await getDocs(
          query(
            collection(db, 'remainders'),
            orderBy('createdAt', 'desc')
          )
        )
        const docs = snap.docs.map(doc => {
          const data = doc.data()
          const paymentDate = parseDateField(data.paymentReceivingDate) || new Date()
          return {
            id: doc.id,
            ...data,
            sellingDate: parseDateField(data.sellingDate) || new Date(),
            paymentReceivingDate: paymentDate,
            createdAt: parseDateField(data.createdAt) || new Date(),
            updatedAt: parseDateField(data.updatedAt) || new Date(),
            status: getCurrentStatus(paymentDate, data.status)
          } as Remainder
        })
        setReminders(docs)
      } catch (err) {
        console.error('Error loading active reminders:', err)
        setError('Failed to load active reminders')
      } finally {
        setLoading(false)
      }
    }
    
    loadReminders()
  }, [])

  // Filter Logic
  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      // Free text search (Stone Variety / Owner Name)
      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        const matchesStone = item.stoneName.toLowerCase().includes(queryLower);
        const matchesOwner = item.ownerName?.toLowerCase().includes(queryLower);
        if (!matchesStone && !matchesOwner) {
          return false;
        }
      }
      // Date Range Filter (By Due Date)
      if (dateFrom && item.paymentReceivingDate) {
        if (item.paymentReceivingDate < startOfDay(dateFrom)) return false;
      }
      if (dateTo && item.paymentReceivingDate) {
        if (item.paymentReceivingDate > endOfDay(dateTo)) return false;
      }
      // Select Filters
      if (buyerTypeFilter !== "all" && item.buyerType !== buyerTypeFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (ownerFilter !== "all" && item.stoneOwner !== ownerFilter) return false;

      return true;
    });
  }, [reminders, searchQuery, dateFrom, dateTo, buyerTypeFilter, statusFilter, ownerFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setBuyerTypeFilter("all");
    setStatusFilter("all");
    setOwnerFilter("all");
  };

  // Analytics Calculations
  const totalSellingPrice = useMemo(() => filteredReminders.reduce((acc, curr) => acc + curr.sellingPrice, 0), [filteredReminders]);
  const totalProfit = useMemo(() => filteredReminders.reduce((acc, curr) => acc + (curr.myProfit || 0), 0), [filteredReminders]);
  const overdueCount = useMemo(() => filteredReminders.filter(r => r.status === 'overdue').length, [filteredReminders]);
  
  // Export handlers
  function exportToCSV() {
    const csvData = filteredReminders.map(r => ({
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
      'Status': r.status
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
    a.download = `active-reminders-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const ReportTemplate = () => (
    <div className="bg-white text-black p-8 font-sans print:m-0 print:p-0 print:w-full" id="printable-report">
      <h1 className="text-[28px] font-bold text-slate-900 mb-2 tracking-tight">RR GEMS</h1>
      <h2 className="text-xl font-bold text-slate-600 mb-4 tracking-tight">Active Reminders Report</h2>
      <p className="text-base text-slate-500 mb-8">
        Due Date Range: {dateFrom ? format(dateFrom, 'yyyy-MM-dd') : 'Any'} - {dateTo ? format(dateTo, 'yyyy-MM-dd') : 'Any'}
      </p>

      <div className="bg-slate-50 p-6 rounded-lg mb-8 max-w-[320px]">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Total Active Records:</span>
          <span className="font-bold text-slate-900 text-[15px]">{filteredReminders.length}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Pending Receiving Value:</span>
          <span className="font-bold text-slate-900 text-[15px]">Rs. {totalSellingPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="text-slate-500 text-[15px]">Pending Pure Profit:</span>
          <span className="font-bold text-slate-900 text-[15px]">Rs. {totalProfit.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 text-[15px]">Overdue Count:</span>
          <span className="font-bold text-slate-900 text-[15px]">{overdueCount}</span>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border border-slate-200">
            <th className="p-3 text-left font-bold text-slate-900 w-[20%]">Title</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Sold Date</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Due Date</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Status</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[15%]">Category</th>
            <th className="p-3 text-left font-bold text-slate-900 w-[20%]">Owner Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredReminders.map((rem) => (
            <tr key={rem.id} className="border border-slate-200">
              <td className="p-3 text-[15px] text-slate-800">{rem.stoneName}</td>
              <td className="p-3 text-[15px] text-slate-800">{format(rem.sellingDate, 'MMM dd, yyyy')}</td>
              <td className={`p-3 text-[15px] font-medium ${rem.status === 'overdue' ? 'text-red-700' : 'text-slate-800'}`}>
                {format(rem.paymentReceivingDate, 'MMM dd, yyyy')}
              </td>
              <td className="p-3 text-[15px]">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  rem.status === 'paid' ? 'bg-emerald-100/50 text-emerald-800' :
                  rem.status === 'overdue' ? 'bg-red-100/50 text-red-800' :
                  'bg-orange-100/50 text-orange-800'
                }`}>
                  {rem.status}
                </span>
              </td>
              <td className="p-3 text-[15px] text-slate-800">{rem.buyerType}</td>
              <td className="p-3 text-[15px] text-slate-800">{rem.ownerName || '-'}</td>
            </tr>
          ))}
          {filteredReminders.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 border border-slate-200 text-center text-slate-500">No active records found.</td>
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
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Bell className="h-5 w-5 text-blue-400" />
             Active Reminders Report
           </h2>
           <div className="flex gap-2">
              <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-9">
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
               placeholder="Search Variety or Owner..." 
               className="pl-9 bg-black/40 border-white/10 text-white h-9 rounded-lg"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={`justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/10 h-9 rounded-lg ${!dateFrom && "text-muted-foreground"}`}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : <span>Due Date From</span>}
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
                {dateTo ? format(dateTo, "MMM dd, yyyy") : <span>Due Date To</span>}
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

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-black/40 border-white/10 text-white h-9 rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
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
                   <p className="text-[10px] uppercase font-bold text-white/40 mb-1">Active Count</p>
                   <p className="text-xl font-bold text-white">{filteredReminders.length}</p>
                 </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-blue-300/80 mb-1">Total Selling</p>
                   <p className="text-xl font-bold text-white">Rs. {totalSellingPrice.toLocaleString()}</p>
                 </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-green-300/80 mb-1">Total Profit</p>
                   <p className="text-xl font-bold text-green-400">Rs. {totalProfit.toLocaleString()}</p>
                 </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center justify-between">
                 <div>
                   <p className="text-[10px] uppercase font-bold text-red-300/80 mb-1">Overdue Count</p>
                   <p className="text-xl font-bold text-red-400">{overdueCount}</p>
                 </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
               <div className="overflow-x-auto">
                 <Table>
                   <TableHeader className="bg-black/40">
                     <TableRow className="border-white/5">
                       <TableHead className="text-blue-300 font-bold">Stone Title</TableHead>
                       <TableHead className="text-blue-300 font-bold">Sold Date</TableHead>
                       <TableHead className="text-blue-300 font-bold">Due Date</TableHead>
                       <TableHead className="text-blue-300 font-bold">Buyer Type</TableHead>
                       <TableHead className="text-blue-300 font-bold">Owner Name</TableHead>
                       <TableHead className="text-blue-300 font-bold">Status</TableHead>
                       <TableHead className="text-blue-300 font-bold text-right">Selling Price</TableHead>
                       <TableHead className="text-blue-300 font-bold text-right">Profit</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {filteredReminders.map((rem) => (
                       <TableRow key={rem.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-bold text-white">{rem.stoneName}</TableCell>
                          <TableCell className="text-white/70">{format(rem.sellingDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-white/70">{format(rem.paymentReceivingDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell className="text-white/70 capitalize">{rem.buyerType}</TableCell>
                          <TableCell className="text-white/70">{rem.ownerName || '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                              rem.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                              rem.status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {rem.status.toUpperCase()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-white">{rem.sellingPrice.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-green-400">{rem.myProfit?.toLocaleString() || '0'}</TableCell>
                       </TableRow>
                     ))}
                     {filteredReminders.length === 0 && (
                       <TableRow>
                         <TableCell colSpan={8} className="text-center text-white/40 py-8">
                           No active records found matching filters
                         </TableCell>
                       </TableRow>
                     )}
                   </TableBody>
                   {filteredReminders.length > 0 && (
                     <TableFooter className="bg-black/60 border-t border-white/10 border-b-0">
                       <TableRow className="hover:bg-transparent">
                         <TableCell colSpan={6} className="text-right text-blue-300 font-bold">TOTALS:</TableCell>
                         <TableCell className="text-right font-mono font-bold text-white">{totalSellingPrice.toLocaleString()}</TableCell>
                         <TableCell className="text-right font-mono font-bold text-green-400">{totalProfit.toLocaleString()}</TableCell>
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
    </>
  )
}