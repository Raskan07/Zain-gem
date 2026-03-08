"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Eye, Upload, X, Archive, ArrowRight, TrendingUp, User } from "lucide-react";
import { format, differenceInDays, parseISO, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc, getDocs, where, limit } from "firebase/firestore";
import { ExportOptions } from "@/components/reports/ExportOptions";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// If the file exists at the correct path, ensure it is named 'customCard.tsx' and exports 'CustomCard'.
// If the file is named differently or located elsewhere, update the import path accordingly.
// Example if the file is named 'CustomCard.tsx':
import CustomCard from "@/components/sub-componets/CustomCard";
import { logActivity } from "@/lib/logger";

// Interfaces
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
  archivedAt?: Date;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
  receiptImage?: string;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

interface NewRemainder {
  stoneName: string;
  stoneWeight: number;
  stoneCost: number;
  sellingPrice: number;
  myProfit: number;
  partyReceives: number;
  sellingDate: Date;
  paymentReceivingDate: Date;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
}

export default function RemaindersPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const [remainders, setRemainders] = useState<Remainder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRemainder, setEditingRemainder] = useState<Remainder | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedRemainder, setSelectedRemainder] = useState<Remainder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvData = remainders.map(r => ({
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

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `reminders_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // add archive state + handler (archives persisted to Firestore)
  const [archives, setArchives] = useState<Remainder[]>([]);
  useEffect(() => {
    const q = query(collection(db, "archives"), orderBy("archivedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const archivesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sellingDate: parseISO(doc.data().sellingDate.toDate().toISOString()),
        paymentReceivingDate: parseISO(doc.data().paymentReceivingDate.toDate().toISOString()),
        createdAt: parseISO(doc.data().createdAt.toDate().toISOString()),
        updatedAt: parseISO(doc.data().updatedAt.toDate().toISOString()),
        archivedAt: doc.data().archivedAt ? parseISO(doc.data().archivedAt.toDate().toISOString()) : undefined,
      })) as Remainder[];
      setArchives(archivesData);
    });
    return () => unsubscribe();
  }, []);

  // Helper function to calculate days remaining from today
  const calculateDaysRemaining = (paymentDate: Date | string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const payment = typeof paymentDate === 'string' ? new Date(paymentDate) : new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    return differenceInDays(payment, today);
  };

  // Helper function to get current status based on payment date
  const getCurrentStatus = (paymentDate: Date, originalStatus: string) => {
    if (originalStatus === "paid") return "paid";
    const daysRemaining = calculateDaysRemaining(paymentDate);
    return daysRemaining < 0 ? "overdue" : "pending";
  };

  // Fetch remainders from Firebase
  useEffect(() => {
    const q = query(collection(db, "remainders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remaindersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sellingDate: parseISO(doc.data().sellingDate.toDate().toISOString()),
        paymentReceivingDate: parseISO(doc.data().paymentReceivingDate.toDate().toISOString()),
        createdAt: parseISO(doc.data().createdAt.toDate().toISOString()),
        updatedAt: parseISO(doc.data().updatedAt.toDate().toISOString()),
      })) as Remainder[];
      setRemainders(remaindersData);
    });

    return () => unsubscribe();
  }, []);

  // GSAP Entrance Animations
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.from(headerRef.current, {
        y: -50,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      // Summary cards staggered animation
      const summaryCards = summaryRef.current?.children;
      if (summaryCards) {
        gsap.from(summaryCards, {
          y: 30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          delay: 0.3
        });
      }

      // Main cards container animation
      gsap.from(cardsContainerRef.current, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.6
      });
    }, containerRef);

    return () => ctx.revert();
  }, [remainders.length]); // Re-run if remainders change or initial load

  const handleAddRemainder = async (data: NewRemainder & { receiptImage?: string }) => {
    try {
      console.log("Adding remainder with data:", data);
      
      const durationInDays = differenceInDays(data.paymentReceivingDate, data.sellingDate);
      const status = durationInDays < 0 ? "overdue" : "pending";
      
      const remainderData = {
        ...data,
        durationInDays,
        status,
        receiptImage: data.receiptImage || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log("Processed remainder data:", remainderData);
      
      const docRef = await addDoc(collection(db, "remainders"), remainderData);
      console.log("Remainder added successfully with ID:", docRef.id);
      
      await logActivity(`Added new remainder for stone: ${data.stoneName}`);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding remainder:", error);
      alert(`Failed to add remainder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateRemainder = async (id: string, data: Partial<Remainder>) => {
    try {
      const remainder = remainders.find(r => r.id === id);
      if (remainder) {
        const durationInDays = differenceInDays(
          data.paymentReceivingDate || remainder.paymentReceivingDate, 
          data.sellingDate || remainder.sellingDate
        );
        const status = durationInDays < 0 ? "overdue" : "pending";
        
        await updateDoc(doc(db, "remainders", id), {
          ...data,
          durationInDays,
          status,
          updatedAt: new Date(),
        });
        await logActivity(`Updated remainder for stone: ${remainder.stoneName}`);
        setEditingRemainder(null);
      }
    } catch (error) {
      console.error("Error updating remainder:", error);
    }
  };

  const handleDeleteRemainder = async (id: string) => {
    if (confirm("Are you sure you want to delete this remainder?")) {
      try {
        const remainder = remainders.find(r => r.id === id);
        if (remainder?.receiptImage) {
          try {
            const imageRef = ref(storage, remainder.receiptImage);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting receipt image:", error);
          }
        }
        await deleteDoc(doc(db, "remainders", id));
        await logActivity(`Deleted remainder for stone: ${remainder?.stoneName}`);
      } catch (error) {
        console.error("Error deleting remainder:", error);
      }
    }
  };

  const openReceiptModal = (receiptUrl: string) => {
    setSelectedReceipt(receiptUrl);
    setShowReceiptModal(true);
  };

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

  const handleArchiveRemainder = async (id: string) => {
    const rem = remainders.find(r => r.id === id);
    if (!rem) return;
    const archivedData = {
      ...rem,
      paymentReceived: true,
      status: "paid",
      archivedAt: new Date(),
    } as any;

    try {
      // persist to Firestore 'archives' collection
      await addDoc(collection(db, "archives"), {
        ...archivedData,
        // ensure Firestore gets proper Date objects
        sellingDate: rem.sellingDate,
        paymentReceivingDate: rem.paymentReceivingDate,
        createdAt: rem.createdAt,
        updatedAt: new Date(),
        archivedAt: new Date(),
      });

      // remove from remainders collection
      await deleteDoc(doc(db, "remainders", id));
      await logActivity(`Archived remainder (Payment Received): ${rem.stoneName}`);

      // update local state for immediate UI feedback
      setArchives((prev) => [archivedData as Remainder, ...prev]);
      setRemainders((prev) => prev.filter((r) => r.id !== id));

      // close any open detail/edit modals for that remainder
      if (selectedRemainder?.id === id) {
        setSelectedRemainder(null);
        setShowDetailModal(false);
      }
      if (editingRemainder?.id === id) {
        setEditingRemainder(null);
      }
    } catch (error) {
      console.error("Error archiving remainder:", error);
      alert("Failed to archive remainder. See console for details.");
    }
  };

  return (
    <div ref={containerRef} className="container mx-auto p-4 md:p-6 lg:p-10 space-y-8 md:space-y-12 min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black">
      {/* Primary Add Remainder Button - More mobile friendly position */}
      <Button 
        onClick={() => {
          console.log("Add Remainder button clicked!");
          setShowAddForm(true);
        }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 md:px-8 py-4 md:py-6 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10"
      >
        <Plus className="h-6 w-6 mr-0 md:mr-2" />
        <span className="hidden md:inline font-bold tracking-wide">New Remainder</span>
      </Button>

       <div className="flex justify-between items-center mb-4">
         <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/remainders/archives")}
              className="bg-white/5 border-white/10 text-blue-200 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">Archives</span>
            </Button>
         </div>
         <ExportOptions
            data={{
              dateRange: { 
                from: format(new Date(), 'yyyy-MM-dd'), 
                to: format(new Date(), 'yyyy-MM-dd') 
              },
              reminders: remainders.map(r => ({
                title: r.stoneName,
                dueDate: r.paymentReceivingDate,
                status: r.status,
                category: r.buyerType,
                assignedTo: r.ownerName || undefined
              }))
            }}
            onExportCSV={handleExportCSV}
            isLoading={isExporting}
          />
       </div>

      <div ref={headerRef} className="flex flex-col md:flex-row justify-between items-center bg-white/5 backdrop-blur-2xl p-6 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl gap-6">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-indigo-300 tracking-tight">
            Remainders
          </h1>
          <p className="text-blue-200/60 mt-3 text-base md:text-lg font-medium max-w-md mx-auto md:mx-0">Precision tracking for stone sales and scheduled payments</p>
        </div>
        <div className="flex items-center gap-4 bg-blue-500/10 p-4 rounded-3xl border border-blue-500/20 backdrop-blur-md">
            <TrendingUp className="h-8 w-8 text-blue-400" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-300/80">Active Value</span>
                <span className="text-xl font-bold text-white">LKR {remainders.reduce((sum, r) => sum + r.sellingPrice, 0).toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Dialog moved outside the button container */}
      <Dialog   
        open={showAddForm} 
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange called with:", open);
          setShowAddForm(open);
        }}
      >
        <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl md:rounded-[2rem] p-0 border-none">
          <div className="p-6 md:p-10 space-y-8">
            <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent ">
                New Remainder
                </DialogTitle>
                <p className="text-white/40 font-medium">Enter transaction details below</p>
            </DialogHeader>
            <AddRemainderForm onSubmit={handleAddRemainder} onCancel={() => setShowAddForm(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div ref={summaryRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative rounded-3xl p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-200/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Total Remainders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tighter">{remainders.length}</p>
          </CardContent>
        </Card>
        
        <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative border-l-yellow-500/50 border-l-4 rounded-3xl p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-200/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl md:text-5xl font-black text-yellow-400 tracking-tighter">
              {remainders.filter(r => getCurrentStatus(r.paymentReceivingDate, r.status) === "pending").length}
            </p>
          </CardContent>
        </Card>

        <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative border-l-red-500/50 border-l-4 rounded-3xl p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-red-200/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl md:text-5xl font-black text-red-500 tracking-tighter">
              {remainders.filter(r => getCurrentStatus(r.paymentReceivingDate, r.status) === "overdue").length}
            </p>
          </CardContent>
        </Card>

        <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative border-l-green-500/50 border-l-4 rounded-3xl p-2">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="pb-2">
            <CardTitle className="text-green-200/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl md:text-4xl font-black text-green-400 tracking-tighter">
              <span className="text-xs font-medium opacity-40 mr-1">LKR</span>
              {remainders.reduce((sum, r) => sum + r.sellingPrice, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Compact Remainders Table */}
      <Card ref={cardsContainerRef} className="backdrop-blur-[80px] bg-white/[0.02] border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[3rem] overflow-hidden">
        <CardHeader className="border-b border-white/5 bg-white/5 px-6 md:px-12 py-8">
          <CardTitle className="text-2xl md:text-3xl font-black text-white flex items-center gap-4">
            <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            Active Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
            {remainders.map((remainder) => (
              <CustomCard
                key={remainder.id}
                remainder={remainder}
                onDetail={() => {
                  setSelectedRemainder(remainder);
                  setShowDetailModal(true);
                }}
                onEdit={() => setEditingRemainder(remainder)}
                onDelete={() => handleDeleteRemainder(remainder.id)}
                onArchive={() => handleArchiveRemainder(remainder.id)}
                onViewReceipt={() => remainder.receiptImage && openReceiptModal(remainder.receiptImage)}
                getStatusBadge={getStatusBadge}
                calculateDaysRemaining={calculateDaysRemaining}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      {editingRemainder && (
        <Dialog open={!!editingRemainder} onOpenChange={() => setEditingRemainder(null)}>
          <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-2xl rounded-3xl md:rounded-[2rem] p-0 border-none">
            <div className="p-6 md:p-10 space-y-8">
                <DialogHeader>
                <DialogTitle className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent ">
                    Edit Remainder
                </DialogTitle>
                <p className="text-white/40 font-medium">Modify existing record details</p>
                </DialogHeader>
                <EditRemainderForm 
                remainder={editingRemainder} 
                onSubmit={(data: Partial<Remainder>) => handleUpdateRemainder(editingRemainder.id, data)} 
                onCancel={() => setEditingRemainder(null)} 
                />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Image Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-4xl backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white rounded-3xl shadow-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Transaction Receipt</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedReceipt && (
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-2xl rounded-3xl md:rounded-[2.5rem] p-0 border-none">
          <div className="p-6 md:p-12 space-y-10">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-3xl md:text-6xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent tracking-tight">
              {selectedRemainder?.stoneName}
            </DialogTitle>
            <p className="text-blue-200/40 text-lg font-medium mt-2">Comprehensive record details</p>
          </DialogHeader>
          {selectedRemainder && (
            <div className="space-y-10 w-full relative z-10">
              {/* Stone Details Section */}
              <div className="p-6 md:p-10 backdrop-blur-md bg-white/5 rounded-3xl border border-white/5 w-full relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp className="h-20 w-20 text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="h-6 w-1 bg-blue-500 rounded-full" />
                    Stone Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Stone Name</span>
                    <p className="text-lg md:text-xl text-white font-bold">{selectedRemainder.stoneName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Weight</span>
                    <p className="text-lg md:text-xl text-white font-bold">{selectedRemainder.stoneWeight}<span className="text-sm font-normal ml-0.5 opacity-60">crt</span></p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Stone Cost</span>
                    <p className="text-lg md:text-xl text-white font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selectedRemainder.stoneCost.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Selling Price</span>
                    <p className="text-lg md:text-xl text-blue-300 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selectedRemainder.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">My Profit</span>
                    <p className="text-lg md:text-xl text-green-400 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selectedRemainder.myProfit?.toLocaleString() || '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-white/30">Party Receives</span>
                    <p className="text-lg md:text-xl text-indigo-300 font-bold"><span className="text-sm font-normal mr-1 opacity-60">LKR</span>{selectedRemainder.partyReceives?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Dates & Status Section */}
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
                                <p className="text-white font-bold">{format(selectedRemainder.sellingDate, "PPP")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Payment Due</span>
                                <p className="text-white font-bold">{format(selectedRemainder.paymentReceivingDate, "PPP")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-6 md:p-8 backdrop-blur-md rounded-3xl border w-full relative flex flex-col justify-center ${
                    selectedRemainder.durationInDays < 0 ? 'bg-red-500/5 border-red-500/10' : 'bg-green-500/5 border-green-500/10'
                }`}>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-2">Duration Analysis</span>
                    <div className="flex items-center justify-between">
                        <p className={`font-black text-3xl md:text-4xl ${selectedRemainder.durationInDays < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {selectedRemainder.durationInDays < 0 ? 
                            `${Math.abs(selectedRemainder.durationInDays)}d Overdue` : 
                            `${selectedRemainder.durationInDays}d Left`
                        }
                        </p>
                        <div className={`p-4 rounded-full ${selectedRemainder.durationInDays < 0 ? 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-green-500/20 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                            <TrendingUp className={`h-10 w-10 ${selectedRemainder.durationInDays < 0 ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>
              </div>

              {/* Ownership & Buyer Section */}
              <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-3xl border border-white/5 w-full">
                <h3 className="text-lg md:text-xl font-bold text-white mb-8 flex items-center gap-3">
                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                    Trade Partners
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-300">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Source</span>
                        <p className="text-white font-bold">{selectedRemainder.stoneOwner === "me" ? "Direct Stock" : `Agent: ${selectedRemainder.ownerName}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-300">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30">Buyer</span>
                        <p className="text-white font-bold">{selectedRemainder.buyerType === "local" ? (selectedRemainder.buyerName || "Local") : "Chinese Group"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-10 border-t border-white/10 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <span className="text-xs uppercase tracking-widest font-bold text-white/30">Current Status:</span>
                    {getStatusBadge(selectedRemainder.status)}
                </div>
                <div className="flex gap-4 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRemainder(selectedRemainder);
                        setShowDetailModal(false);
                      }}
                      className="bg-white/5 border-white/10 text-blue-400 hover:bg-white/10 px-6 py-6 rounded-2xl font-bold transition-all hover:scale-105"
                    >
                      <Edit className="h-5 w-5 mr-3" />
                      Edit Record
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        handleArchiveRemainder(selectedRemainder.id);
                        setShowDetailModal(false);
                      }}
                      className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 px-8 py-6 rounded-2xl font-black transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.1)]"
                    >
                      Process Payment
                    </Button>

                    {selectedRemainder.receiptImage && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          openReceiptModal(selectedRemainder.receiptImage!);
                          setShowDetailModal(false);
                        }}
                        className="text-white/40 hover:text-white px-6 py-6 rounded-2xl"
                      >
                        <Eye className="h-5 w-5 mr-3" />
                        View Receipt
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
}

// Add Remainder Form Component - Main Form with 3 columns
function AddRemainderForm({ onSubmit, onCancel }: { 
  onSubmit: (data: NewRemainder & { receiptImage?: string }) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<NewRemainder>({
    stoneName: "",
    stoneWeight: 0,
    stoneCost: 0,
    sellingPrice: 0,
    myProfit: 0,
    partyReceives: 0,
    sellingDate: new Date(),
    paymentReceivingDate: new Date(),
    stoneOwner: "me",
    ownerName: "",
    buyerType: "local",
    buyerName: "",
  });
  // Stone ID autofill states
  const [stoneIdInput, setStoneIdInput] = useState<string>("");
  const [stoneLoading, setStoneLoading] = useState(false);
  const [stoneFetchError, setStoneFetchError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  // AddRemainderForm specific handlers

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, receiptImage });
  };

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingReceipt(true);
    try {
      const file = files[0];
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setReceiptImage(downloadURL);
    } catch (error) {
      console.error("Error uploading receipt:", error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = async () => {
    if (receiptImage) {
      try {
        const imageRef = ref(storage, receiptImage);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting receipt:", error);
      }
      setReceiptImage("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleReceiptUpload(e.dataTransfer.files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="grid grid-cols-1 gap-10">
        {/* Stone Details - AddRemainderForm */}
        <div className="space-y-6 p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <div className="h-6 w-1 bg-blue-500 rounded-full" />
            Stone Information
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="stoneName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Stone Name</Label>
                <Input
                id="stoneName"
                value={formData.stoneName}
                onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
                className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus:bg-white/10 transition-all border-none shadow-inner"
                placeholder="Enter stone name"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="stoneWeight" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Weight (crt)</Label>
                <Input
                id="stoneWeight"
                type="number"
                step="0.01"
                value={formData.stoneWeight}
                onChange={(e) => setFormData({ ...formData, stoneWeight: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="stoneCost" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Stone Cost (LKR)</Label>
                <Input
                id="stoneCost"
                type="number"
                step="0.01"
                value={formData.stoneCost}
                onChange={(e) => setFormData({ ...formData, stoneCost: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="sellingPrice" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Selling Price (LKR)</Label>
                <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="myProfit" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">My Profit (LKR)</Label>
                <Input
                id="myProfit"
                type="number"
                step="0.01"
                value={formData.myProfit}
                onChange={(e) => setFormData({ ...formData, myProfit: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-green-400 font-bold rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="partyReceives" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Party Receives (LKR)</Label>
                <Input
                id="partyReceives"
                type="number"
                step="0.01"
                value={formData.partyReceives}
                onChange={(e) => setFormData({ ...formData, partyReceives: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-blue-400 font-bold rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col justify-between">
            {/* Ownership - AddRemainderForm */}
            <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                    Ownership
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="stoneOwner" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Ownership Type</Label>
                        <Select
                        value={formData.stoneOwner}
                        onValueChange={(value: "me" | "others") => setFormData({ ...formData, stoneOwner: value })}
                        >
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            <SelectItem value="me">Direct Stock</SelectItem>
                            <SelectItem value="others">Third Party</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    {formData.stoneOwner === "others" && (
                        <div className="space-y-2">
                        <Label htmlFor="ownerName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Owner Name</Label>
                        <Input
                            id="ownerName"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                            placeholder="Enter agent name"
                            required
                        />
                        </div>
                    )}
                </div>
            </div>

            {/* Buyer Details */}
            <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <div className="h-6 w-1 bg-blue-400 rounded-full" />
                    Buyer Info
                </h3>
                <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="buyerType" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Buyer Group</Label>
                    <Select
                    value={formData.buyerType}
                    onValueChange={(value: "local" | "chinese") => setFormData({ ...formData, buyerType: value })}
                    >
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                        <SelectItem value="local">Local Individual</SelectItem>
                        <SelectItem value="chinese">Chinese Exporters</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {formData.buyerType === "local" && (
                    <div className="space-y-2">
                    <Label htmlFor="buyerName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Buyer Name</Label>
                    <Input
                        id="buyerName"
                        value={formData.buyerName}
                        onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                        className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                        placeholder="Enter name"
                    />
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Dates - AddRemainderForm */}
        <div className="space-y-6 p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-yellow-500 rounded-full" />
            Timeline
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <Label className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Selling Date</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    className={cn(
                        "h-14 w-full justify-start text-left font-bold bg-white/5 border-none text-white rounded-2xl shadow-inner",
                        !formData.sellingDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-3 h-5 w-5 text-yellow-500" />
                    {formData.sellingDate ? format(formData.sellingDate, "PPP") : <span>Select date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <Calendar
                    mode="single"
                    selected={formData.sellingDate}
                    onSelect={(date) => date && setFormData({ ...formData, sellingDate: date })}
                    initialFocus
                    className="bg-transparent text-white"
                    />
                </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Payment Due</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    className={cn(
                        "h-14 w-full justify-start text-left font-bold bg-white/5 border-none text-white rounded-2xl shadow-inner",
                        !formData.paymentReceivingDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
                    {formData.paymentReceivingDate ? format(formData.paymentReceivingDate, "PPP") : <span>Select date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <Calendar
                    mode="single"
                    selected={formData.paymentReceivingDate}
                    onSelect={(date) => date && setFormData({ ...formData, paymentReceivingDate: date })}
                    initialFocus
                    className="bg-transparent text-white"
                    />
                </PopoverContent>
                </Popover>
            </div>
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <div className="h-6 w-1 bg-green-500 rounded-full" />
                Evidence
            </h3>
            <div className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-6 text-center hover:border-blue-500/30 transition-all duration-300 bg-white/[0.02]">
            {receiptImage ? (
                <div className="space-y-4">
                <img
                    src={receiptImage}
                    alt="Receipt"
                    className="max-w-[200px] mx-auto rounded-2xl shadow-2xl"
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={removeReceipt}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                >
                    <X className="h-4 w-4 mr-2" />
                    Discard
                </Button>
                </div>
            ) : (
                <label htmlFor="receipt-upload" className="cursor-pointer group">
                {uploadingReceipt ? (
                    <div className="flex flex-col items-center py-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Processing...</p>
                    </div>
                ) : (
                    <div className="py-4">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-white/20 group-hover:text-blue-500 transition-colors" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Tap to Upload Receipt</p>
                    </div>
                )}
                </label>
            )}
            <input
                type="file"
                accept="image/*"
                onChange={(e) => handleReceiptUpload(e.target.files)}
                className="hidden"
                id="receipt-upload"
                disabled={uploadingReceipt}
            />
            </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          className="h-14 px-8 text-white/40 hover:text-white rounded-2xl font-bold"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
        >
          Add Remainder
        </Button>
      </div>
    </form>
  );
}

// Edit Remainder Form Component
function EditRemainderForm({ 
  remainder, 
  onSubmit, 
  onCancel 
}: { 
  remainder: Remainder; 
  onSubmit: (data: Partial<Remainder>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<Partial<Remainder>>({
    stoneName: remainder.stoneName,
    stoneWeight: remainder.stoneWeight,
    stoneCost: remainder.stoneCost,
    sellingPrice: remainder.sellingPrice,
    myProfit: remainder.myProfit || 0,
    partyReceives: remainder.partyReceives || 0,
    sellingDate: remainder.sellingDate,
    paymentReceivingDate: remainder.paymentReceivingDate,
    stoneOwner: remainder.stoneOwner,
    ownerName: remainder.ownerName,
    buyerType: remainder.buyerType,
    buyerName: remainder.buyerName,
  });
  const [receiptImage, setReceiptImage] = useState<string>(remainder.receiptImage || "");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  // Edit form stone autofill states
  const [editStoneIdInput, setEditStoneIdInput] = useState<string>("");
  const [editStoneLoading, setEditStoneLoading] = useState(false);
  const [editStoneFetchError, setEditStoneFetchError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, receiptImage });
  };

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingReceipt(true);
    try {
      const file = files[0];
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setReceiptImage(downloadURL);
    } catch (error) {
      console.error("Error uploading receipt:", error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = async () => {
    if (receiptImage && receiptImage !== remainder.receiptImage) {
      try {
        const imageRef = ref(storage, receiptImage);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting receipt:", error);
      }
    }
    setReceiptImage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="grid grid-cols-1 gap-10">
        {/* Stone Details - EditRemainderForm */}
        <div className="space-y-6 p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          <h3 className="text-xl font-black text-white flex items-center gap-3">
            <div className="h-6 w-1 bg-blue-500 rounded-full" />
            Stone Information
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="edit-stoneName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Stone Name</Label>
                <div className="flex items-center gap-2">
                    <Input
                    id="edit-stoneName"
                    value={formData.stoneName}
                    onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
                    className="h-14 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl focus:bg-white/10 transition-all border-none shadow-inner flex-1"
                    placeholder="Enter stone name"
                    required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-stoneWeight" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Weight (crt)</Label>
                <Input
                id="edit-stoneWeight"
                type="number"
                step="0.01"
                value={formData.stoneWeight}
                onChange={(e) => setFormData({ ...formData, stoneWeight: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-stoneCost" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Stone Cost (LKR)</Label>
                <Input
                id="edit-stoneCost"
                type="number"
                step="0.01"
                value={formData.stoneCost}
                onChange={(e) => setFormData({ ...formData, stoneCost: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-sellingPrice" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Selling Price (LKR)</Label>
                <Input
                id="edit-sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="edit-myProfit" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">My Profit (LKR)</Label>
                <Input
                id="edit-myProfit"
                type="number"
                step="0.01"
                value={formData.myProfit}
                onChange={(e) => setFormData({ ...formData, myProfit: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-green-400 font-bold rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="edit-partyReceives" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Party Receives (LKR)</Label>
                <Input
                id="edit-partyReceives"
                type="number"
                step="0.01"
                value={formData.partyReceives}
                onChange={(e) => setFormData({ ...formData, partyReceives: parseFloat(e.target.value) || 0 })}
                className="h-14 bg-white/5 border-white/10 text-blue-400 font-bold rounded-2xl border-none shadow-inner"
                placeholder="0.00"
                required
                />
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col justify-between">
            {/* Ownership - EditRemainderForm */}
            <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <div className="h-6 w-1 bg-indigo-500 rounded-full" />
                    Ownership
                </h3>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="edit-stoneOwner" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Ownership Type</Label>
                        <Select
                        value={formData.stoneOwner}
                        onValueChange={(value: "me" | "others") => setFormData({ ...formData, stoneOwner: value })}
                        >
                        <SelectTrigger className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner focus:ring-0">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            <SelectItem value="me">Direct Stock</SelectItem>
                            <SelectItem value="others">Third Party</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>

                    {formData.stoneOwner === "others" && (
                        <div className="space-y-2">
                        <Label htmlFor="edit-ownerName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Owner Name</Label>
                        <Input
                            id="edit-ownerName"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                            placeholder="Enter agent name"
                            required
                        />
                        </div>
                    )}
                </div>
            </div>

            {/* Buyer Details */}
            <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                    <div className="h-6 w-1 bg-blue-400 rounded-full" />
                    Buyer Info
                </h3>
                <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="edit-buyerType" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Buyer Group</Label>
                    <Select
                    value={formData.buyerType}
                    onValueChange={(value: "local" | "chinese") => setFormData({ ...formData, buyerType: value })}
                    >
                    <SelectTrigger className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                        <SelectItem value="local">Local Individual</SelectItem>
                        <SelectItem value="chinese">Chinese Exporters</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {formData.buyerType === "local" && (
                    <div className="space-y-2">
                    <Label htmlFor="edit-buyerName" className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Buyer Name</Label>
                    <Input
                        id="edit-buyerName"
                        value={formData.buyerName}
                        onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                        className="h-14 bg-white/5 border-white/10 text-white rounded-2xl border-none shadow-inner"
                        placeholder="Enter name"
                    />
                    </div>
                )}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Dates - EditRemainderForm */}
        <div className="space-y-6 p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
            <div className="h-6 w-1 bg-yellow-500 rounded-full" />
            Timeline
          </h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
                <Label className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Selling Date</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    className={cn(
                        "h-14 w-full justify-start text-left font-bold bg-white/5 border-none text-white rounded-2xl shadow-inner",
                        !formData.sellingDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-3 h-5 w-5 text-yellow-500" />
                    {formData.sellingDate ? format(formData.sellingDate, "PPP") : <span>Select date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <Calendar
                    mode="single"
                    selected={formData.sellingDate}
                    onSelect={(date) => date && setFormData({ ...formData, sellingDate: date })}
                    initialFocus
                    className="bg-transparent text-white"
                    />
                </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <Label className="text-white/40 text-[10px] font-bold uppercase tracking-widest ml-1">Payment Due</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant="outline"
                    className={cn(
                        "h-14 w-full justify-start text-left font-bold bg-white/5 border-none text-white rounded-2xl shadow-inner",
                        !formData.paymentReceivingDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-3 h-5 w-5 text-blue-500" />
                    {formData.paymentReceivingDate ? format(formData.paymentReceivingDate, "PPP") : <span>Select date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-900 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <Calendar
                    mode="single"
                    selected={formData.paymentReceivingDate}
                    onSelect={(date) => date && setFormData({ ...formData, paymentReceivingDate: date })}
                    initialFocus
                    className="bg-transparent text-white"
                    />
                </PopoverContent>
                </Popover>
            </div>
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="p-6 md:p-8 backdrop-blur-md bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3">
                <div className="h-6 w-1 bg-green-500 rounded-full" />
                Evidence
            </h3>
            <div className="border-2 border-dashed border-white/10 rounded-[1.5rem] p-6 text-center hover:border-blue-500/30 transition-all duration-300 bg-white/[0.02]">
            {receiptImage ? (
                <div className="space-y-4">
                <img
                    src={receiptImage}
                    alt="Receipt"
                    className="max-w-[200px] mx-auto rounded-2xl shadow-2xl"
                />
                <Button
                    type="button"
                    variant="ghost"
                    onClick={removeReceipt}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                >
                    <X className="h-4 w-4 mr-2" />
                    Discard
                </Button>
                </div>
            ) : (
                <label htmlFor="edit-receipt-upload" className="cursor-pointer group">
                {uploadingReceipt ? (
                    <div className="flex flex-col items-center py-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Processing...</p>
                    </div>
                ) : (
                    <div className="py-4">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-white/20 group-hover:text-blue-500 transition-colors" />
                    <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Tap to Upload Receipt</p>
                    </div>
                )}
                </label>
            )}
            <input
                type="file"
                accept="image/*"
                onChange={(e) => handleReceiptUpload(e.target.files)}
                className="hidden"
                id="edit-receipt-upload"
                disabled={uploadingReceipt}
            />
            </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-4 pt-10">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel} 
          className="h-14 px-8 text-white/40 hover:text-white rounded-2xl font-bold"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all hover:scale-105"
        >
          Update Remainder
        </Button>
      </div>
    </form>
  );
}
