"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye, ArrowLeft, TrendingUp, Calendar, User, Archive } from "lucide-react";
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

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvData = archives.map(r => ({
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

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
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
        
        <div className="flex gap-4">
            <ArchiveExportOptions
                data={{
                dateRange: { 
                    from: format(new Date(), 'yyyy-MM-dd'), 
                    to: format(new Date(), 'yyyy-MM-dd') 
                },
                archives: archives.map(a => ({
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

      <Card ref={cardsContainerRef} className="backdrop-blur-[80px] bg-white/[0.02] border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 px-6 md:px-12 py-8">
          <CardTitle className="text-2xl md:text-3xl font-black text-white flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            Historical Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-12">
          {archives.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/5 border-dashed">
                <Archive className="h-16 w-16 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-bold uppercase tracking-widest text-sm">No archived records found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
              {archives.map((arc) => (
                  <CustomCard
                    key={arc.id}
                    remainder={arc}
                    onDetail={() => {
                        setSelected(arc);
                        setOpenDetail(true);
                    }}
                    onViewReceipt={() => openImage(arc.receiptImage)}
                    getStatusBadge={getStatusBadge}
                    calculateDaysRemaining={calculateDaysRemaining}
                  />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Sold On</span>
                                <p className="text-white font-bold">{format(selected.sellingDate, "PPP")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
                                <Calendar className="h-5 w-5" />
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
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-bold">Transaction Receipt</DialogTitle>
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
