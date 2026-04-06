"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Eye, ArrowLeft, TrendingUp, Calendar as CalendarIcon, User, Archive, Search, Printer, FileText, Download, FilterX } from "lucide-react";
import CustomCard from "@/components/sub-componets/CustomCard";
import { ArchiveExportOptions } from "@/components/reports/ArchiveExportOptions";

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

export default function ArchivesPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const [archives, setArchives] = useState<Remainder[]>([]);
  const [selected, setSelected] = useState<Remainder | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageToShow, setImageToShow] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [buyerTypeFilter, setBuyerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
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

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `archives_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const openImage = (url: string | undefined) => {
    if (!url) return;
    setImageToShow(url);
    setImageModalOpen(true);
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image, falling back to new tab', error);
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    const q = query(collection(db, "archives"), orderBy("archivedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ...data,
          sellingDate: data.sellingDate?.toDate ? data.sellingDate.toDate() : new Date(String(data.sellingDate)),
          paymentReceivingDate: data.paymentReceivingDate?.toDate ? data.paymentReceivingDate.toDate() : new Date(String(data.paymentReceivingDate)),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(String(data.createdAt)),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(String(data.updatedAt)),
          archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(String(data.archivedAt)) : undefined),
        } as Remainder;
      });
      setArchives(items);
    });

    return () => unsub();
  }, []);

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
  const localBuyersCount = useMemo(() => filteredArchives.filter(a => a.buyerType === 'local').length, [filteredArchives]);
  const chineseBuyersCount = useMemo(() => filteredArchives.filter(a => a.buyerType === 'chinese').length, [filteredArchives]);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      gsap.from(cardsContainerRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.3
      });
    }, containerRef);

    return () => ctx.revert();
  }, [archives.length === 0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const calculateDaysRemaining = (date: Date | string) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date as any);
    d.setHours(0,0,0,0);
    return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const ReportTemplate = () => (
    <div className="bg-white text-black p-8 font-sans print:m-0 print:p-0 print:w-full" id="printable-report">
      <h1 className="text-[28px] font-bold text-slate-900 mb-2 tracking-tight">Archives Report</h1>
      <p className="text-base text-slate-500 mb-8">
        Due Date Range: {dateFrom ? format(dateFrom, 'yyyy-MM-dd') : 'Any'} - {dateTo ? format(dateTo, 'yyyy-MM-dd') : 'Any'}
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
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background-color: white; }
        }
      `}} />
    </div>
  );

  return (
    <div ref={containerRef} className="container mx-auto p-4 md:p-6 lg:p-10 space-y-8 md:space-y-12 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-black">
      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-center bg-white/5 backdrop-blur-2xl p-6 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
           <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="p-4 rounded-2xl bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
           >
             <ArrowLeft className="h-6 w-6" />
           </Button>
           <div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-blue-300 tracking-tight">
              Archives
            </h1>
            <p className="text-indigo-200/60 mt-3 text-base md:text-lg font-medium">History of processed payments and completed trades</p>
           </div>
        </div>
        
        <div className="flex gap-4 items-center">
            <Button
              onClick={() => setShowPrintReport(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-6 font-bold shadow-lg shadow-indigo-500/20"
            >
              <FileText className="mr-2 h-5 w-5" />
              Generate Report
            </Button>
            <ArchiveExportOptions
                data={{
                dateRange: { 
                    from: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'), 
                    to: dateTo ? format(dateTo, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd') 
                },
                archives: filteredArchives.map(a => ({
                    title: a.stoneName,
                    archivedDate: a.archivedAt || new Date(),
                    originalDueDate: a.paymentReceivingDate,
                    status: a.status,
                    category: a.buyerType,
                    assignedTo: a.ownerName || undefined
                }))
                }}
                onExportCSV={handleExportCSV}
                isLoading={isExporting}
            />
            <div className="flex items-center gap-4 bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20 backdrop-blur-md">
                <Archive className="h-8 w-8 text-indigo-400" />
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-300/80">Total Archived</span>
                    <span className="text-xl font-bold text-white">{archives.length} Items</span>
                </div>
            </div>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <Card className="backdrop-blur-xl bg-white/5 border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FilterX className="h-5 w-5 text-indigo-400" />
            Advanced Filters
          </h3>
          <Button variant="ghost" onClick={resetFilters} className="text-indigo-300 hover:text-white hover:bg-white/10 text-xs uppercase tracking-wider font-bold h-8">
            Reset Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Search Stone Variety</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input 
                placeholder="Ruby, Sapphire..." 
                className="pl-10 bg-black/40 border-white/10 text-white rounded-xl h-11 focus-visible:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
             <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Date From</label>
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl ${!dateFrom && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-white/10 bg-slate-900 text-white" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
             <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Date To</label>
             <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-left font-normal bg-black/40 border-white/10 text-white hover:bg-white/10 h-11 rounded-xl ${!dateTo && "text-muted-foreground"}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-white/10 bg-slate-900 text-white" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Buyer Type</label>
            <Select value={buyerTypeFilter} onValueChange={setBuyerTypeFilter}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-11 focus:ring-indigo-500">
                <SelectValue placeholder="All Buyers" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="all">All Buyers</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-white/50">Stone Owner</label>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="bg-black/40 border-white/10 text-white rounded-xl h-11 focus:ring-indigo-500">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="me">Direct Stock</SelectItem>
                <SelectItem value="others">Third Party</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ANALYTICS SUMMARY BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col justify-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-blue-300/80 mb-1">Total Selling Price</p>
            <p className="text-2xl md:text-3xl font-black text-white"><span className="text-sm text-white/40 font-bold mr-1">LKR</span>{totalSellingPrice.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-500/20 p-5 rounded-2xl flex flex-col justify-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-green-300/80 mb-1">Total Pure Profit</p>
            <p className="text-2xl md:text-3xl font-black text-green-400"><span className="text-sm text-green-400/40 font-bold mr-1">LKR</span>{totalProfit.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col justify-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-amber-300/80 mb-1">Average Duration</p>
            <p className="text-2xl md:text-3xl font-black text-amber-400">{avgDuration} <span className="text-sm text-white/40 font-bold">Days</span></p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-600/10 border border-purple-500/20 p-5 rounded-2xl flex flex-col justify-center">
            <p className="text-[10px] uppercase font-black tracking-widest text-purple-300/80 mb-1">Buyer Demographics</p>
            <div className="flex gap-4">
               <div>
                  <span className="text-lg font-black text-white">{chineseBuyersCount}</span>
                  <span className="text-xs text-purple-300/60 ml-1 font-bold">CH</span>
               </div>
               <div>
                  <span className="text-lg font-black text-white">{localBuyersCount}</span>
                  <span className="text-xs text-purple-300/60 ml-1 font-bold">LC</span>
               </div>
            </div>
        </div>
      </div>

      <Card ref={cardsContainerRef} className="backdrop-blur-[80px] bg-white/[0.02] border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 px-6 md:px-12 py-8 flex flex-row items-center justify-between">
          <CardTitle className="text-2xl md:text-3xl font-black text-white flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Filtered Records ({filteredArchives.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredArchives.length === 0 ? (
            <div className="text-center py-20 bg-white/5">
                <Archive className="h-16 w-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No records match current filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="bg-indigo-950/50 sticky top-0 z-10 border-b border-white/10 text-xs tracking-wider uppercase">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="font-bold text-indigo-300 py-5 w-16 px-6">#</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Stone Title</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Archive Date</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Orig. Due</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Status</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Buyer</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5">Owner Name</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5 text-right text-green-300/80">Selling (LKR)</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5 text-right text-blue-300/80">Profit (LKR)</TableHead>
                    <TableHead className="font-bold text-indigo-300 py-5 text-right pr-6">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchives.map((arc, index) => (
                    <TableRow 
                      key={arc.id} 
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelected(arc);
                        setOpenDetail(true);
                      }}
                    >
                      <TableCell className="text-white/30 font-mono px-6">{index + 1}</TableCell>
                      <TableCell className="font-bold text-white max-w-[200px] truncate">{arc.stoneName}</TableCell>
                      <TableCell className="text-white/70">{arc.archivedAt ? format(arc.archivedAt, 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell className="text-white/70">{format(arc.paymentReceivingDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(arc.status)}</TableCell>
                      <TableCell className="capitalize font-medium text-white/70">
                         <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${arc.buyerType === 'local' ? 'bg-orange-500/10 text-orange-400' : 'bg-fuchsia-500/10 text-fuchsia-400'}`}>
                           {arc.buyerType}
                         </span>
                      </TableCell>
                      <TableCell className="text-white/70">{arc.ownerName || '-'}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-green-400">{arc.sellingPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono font-medium text-blue-400">{arc.myProfit?.toLocaleString() || '0'}</TableCell>
                      <TableCell className="text-right font-mono text-white/50 pr-6">{arc.durationInDays}d</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-indigo-950/80 border-t border-indigo-500/20 border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="text-right text-indigo-300 font-bold tracking-wider py-6">FILTERED TOTALS</TableCell>
                    <TableCell className="text-right font-mono text-lg font-black text-green-400">{totalSellingPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-lg font-black text-blue-400">{totalProfit.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-lg font-black text-white/70 pr-6">{avgDuration}d AVG</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden Printable Report directly injected into the DOM instead of inside a Dialog */}
      <div className="hidden print:block w-full">
         <ReportTemplate />
      </div>

      {/* Detail dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-2xl rounded-3xl md:rounded-[2.5rem] p-0 border-none">
          <div className="p-6 md:p-12 space-y-10">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-3xl md:text-6xl font-black bg-gradient-to-r from-white via-indigo-200 to-blue-300 bg-clip-text text-transparent tracking-tight">
              {selected?.stoneName}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px]">
                    Successfully Processed
                </Badge>
                {selected?.archivedAt && (
                    <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                        Archived On {format(selected.archivedAt, "PPP")}
                    </span>
                )}
            </div>
          </DialogHeader>
          {selected && (
            <div className="space-y-10 w-full relative z-10">
              <div className="p-6 md:p-10 backdrop-blur-md bg-white/5 rounded-3xl border border-white/5 w-full relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="h-20 w-20 text-indigo-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                    Stone Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Stone Name</span>
                    <p className="text-lg md:text-xl text-white font-bold">{selected.stoneName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Weight</span>
                    <p className="text-lg md:text-xl text-white font-bold">{selected.stoneWeight}<span className="text-sm font-normal ml-0.5 opacity-60">crt</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Stone Cost</span>
                    <p className="text-lg md:text-xl text-white font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selected.stoneCost.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Selling Price</span>
                    <p className="text-lg md:text-xl text-indigo-300 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selected.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Total Profit</span>
                    <p className="text-lg md:text-xl text-green-400 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selected.myProfit?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Party Settlement</span>
                    <p className="text-lg md:text-xl text-blue-300 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selected.partyReceives?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-3xl border border-white/5 w-full relative">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="h-6 w-1 bg-yellow-500 rounded-full" />
                        Timeline
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white/5 text-white/60">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Sold On</span>
                                <p className="text-white font-bold">{format(selected.sellingDate, "PPP")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Payment Received</span>
                                <p className="text-white font-bold">{format(selected.paymentReceivingDate, "PPP")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8 backdrop-blur-md bg-green-500/5 rounded-3xl border border-green-500/10 w-full relative flex flex-col justify-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-2">Completion Analysis</span>
                    <div className="flex items-center justify-between">
                        <p className="font-black text-3xl md:text-4xl text-green-500">
                           Transaction Completed
                        </p>
                        <div className="p-4 rounded-full bg-green-500/20 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <TrendingUp className="h-10 w-10" />
                        </div>
                    </div>
                </div>
              </div>

              <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-3xl border border-white/5 w-full">
                <h3 className="text-lg md:text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                    Trade Partners
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-300">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Source</span>
                        <p className="text-white font-bold">{selected.stoneOwner === "me" ? "Direct Stock" : `Agent: ${selected.ownerName}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-300">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Buyer</span>
                        <p className="text-white font-bold">{selected.buyerType === "local" ? (selected.buyerName || "Local") : "Chinese Group"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-white/10 flex flex-wrap items-center justify-end gap-6">
                    {selected.receiptImage && (
                      <Button
                        variant="ghost"
                        onClick={() => openImage(selected.receiptImage)}
                        className="text-white/40 hover:text-white px-6 py-6 rounded-2xl"
                      >
                        <Eye className="h-5 w-5 mr-3" />
                        View Linked Receipt
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setOpenDetail(false)} className="bg-white/5 border-white/10 text-white hover:bg-white/10 px-8 py-6 rounded-2xl font-bold">
                        Close Detail
                    </Button>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-4xl backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white rounded-3xl shadow-3xl">
          <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Transaction Receipt</DialogTitle>
            {imageToShow && (
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10 text-white"
                onClick={() => handleDownloadImage(imageToShow, `Receipt-${selected?.stoneName || 'Transaction'}.jpg`)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogHeader>
          <div className="flex justify-center p-8">
            {imageToShow && (
              <img
                src={imageToShow}
                alt="Enlarged receipt"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
