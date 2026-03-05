"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday, 
  addMonths, 
  subMonths,
  getDay
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart, 
  TrendingUp, 
  Info, 
  Bell, 
  Archive, 
  X,
  Gem,
  Calendar as CalendarIcon,
  Weight,
  DollarSign,
  Tag,
  User,
  Clock,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Maximize2,
  ChevronLeft as ChevronLeftIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";

interface StoneTransaction {
  id: string;
  name: string;
  type: "buy" | "sell" | "reminder" | "archive";
  amount?: number;
  date: Date;
  weight?: number;
  status?: string;
  source: "stones" | "remainders" | "archives";
  originalData: any;
}

export function StoneCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<StoneTransaction[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewingItem, setViewingItem] = useState<StoneTransaction | null>(null);
  
  const calendarRef = useRef<HTMLDivElement>(null);
  const peekOverlayRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // Real-time listeners for all three collections
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const sourceData: Record<string, StoneTransaction[]> = { stones: [], remainders: [], archives: [] };

    const updateAll = () => {
      const all = Object.values(sourceData).flat();
      setTransactions(all);
    };

    // 1. Stones
    const qStones = query(collection(db, "stones"));
    unsubscribes.push(onSnapshot(qStones, (snapshot) => {
      const txs: StoneTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let date = data.createdAt?.toDate?.() || data.date?.toDate?.() || new Date();
        
        txs.push({
          id: `${doc.id}-buy`,
          name: data.name || "Unnamed",
          type: "buy",
          amount: data.stoneCost || 0,
          date: date,
          weight: data.weightInRough || data.weight,
          status: data.status,
          source: "stones",
          originalData: { ...data, id: doc.id }
        });

        if (data.status === "Sold") {
          let soldDate = data.updatedAt?.toDate?.() || data.completedAt?.toDate?.() || date;
          txs.push({
            id: `${doc.id}-sell`,
            name: data.name || "Unnamed",
            type: "sell",
            amount: data.soldPrice || 0,
            date: soldDate,
            weight: data.weight,
            status: "Sold",
            source: "stones",
            originalData: { ...data, id: doc.id }
          });
        }
      });
      sourceData.stones = txs;
      updateAll();
    }));

    // 2. Remainders
    const qRem = query(collection(db, "remainders"));
    unsubscribes.push(onSnapshot(qRem, (snapshot) => {
      const txs: StoneTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let date = data.sellingDate?.toDate?.() || data.paymentReceivingDate?.toDate?.() || data.date?.toDate?.() || new Date();
        txs.push({
          id: doc.id,
          name: data.stoneName || "Task",
          type: "reminder",
          amount: data.sellingPrice || 0,
          date: date,
          weight: data.stoneWeight,
          source: "remainders",
          originalData: { ...data, id: doc.id }
        });
      });
      sourceData.remainders = txs;
      updateAll();
    }));

    // 3. Archives
    const qArc = query(collection(db, "archives"));
    unsubscribes.push(onSnapshot(qArc, (snapshot) => {
      const txs: StoneTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let date = data.archivedAt?.toDate?.() || data.sellingDate?.toDate?.() || new Date();
        txs.push({
          id: doc.id,
          name: data.stoneName || "Archived Item",
          type: "archive",
          amount: data.sellingPrice || 0,
          date: date,
          weight: data.stoneWeight,
          source: "archives",
          originalData: { ...data, id: doc.id }
        });
      });
      sourceData.archives = txs;
      updateAll();
    }));

    return () => unsubscribes.forEach(u => u());
  }, []);

  const closePeek = () => {
    gsap.to(".peek-card", {
      y: 50, opacity: 0, scale: 0.95, duration: 0.3, ease: "power2.in",
      onComplete: () => {
        setSelectedDay(null);
        setViewingItem(null);
      }
    });
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const startDateIdx = getDay(monthStart); // 0-6
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: endOfMonth(currentDate) });
  const paddingDays = Array.from({ length: startDateIdx });

  const getDayTransactions = (day: Date) => transactions.filter(t => isSameDay(t.date, day));

  // Animations
  useEffect(() => {
    if (calendarRef.current) {
      gsap.fromTo(
        calendarRef.current.querySelectorAll(".calendar-day"),
        { opacity: 0, scale: 0.9, y: 5 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.005, ease: "power2.out" }
      );
    }
  }, [currentDate]);

  useEffect(() => {
    if (selectedDay && peekOverlayRef.current) {
      gsap.fromTo(peekOverlayRef.current,
        { opacity: 0, backdropFilter: "blur(0px)" },
        { opacity: 1, backdropFilter: "blur(8px)", duration: 0.4 }
      );
      gsap.fromTo(".peek-card",
        { y: 100, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
      );
    }
  }, [selectedDay]);

  useEffect(() => {
    if (viewingItem && modalContentRef.current) {
       gsap.fromTo(modalContentRef.current,
         { x: 50, opacity: 0 },
         { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
       );
    }
  }, [viewingItem]);

  // Body scroll lock
  useEffect(() => {
    if (selectedDay) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedDay]);

  const modal = selectedDay && typeof document !== "undefined" ? createPortal(
    <div 
      ref={peekOverlayRef}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-xl transition-all sm:p-12"
      style={{ isolation: 'isolate' }}
      onClick={(e) => e.target === e.currentTarget && closePeek()}
    >
      <div className="peek-card w-full max-w-6xl bg-[#080808] md:border md:border-white/10 md:rounded-[48px] shadow-[0_40px_120px_-15px_rgba(0,0,0,1)] overflow-hidden flex flex-col lg:flex-row h-full md:h-[85vh] lg:h-[800px] relative">
        
        {/* List Sidebar (Stage 1) - Hidden on mobile if viewing an item */}
        <div className={cn(
          "w-full lg:w-[450px] border-r border-white/5 flex flex-col h-full bg-secondary/5 transition-all duration-300",
          viewingItem ? "hidden lg:flex" : "flex"
        )}>
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div>
               <h4 className="text-2xl font-black tracking-tighter">{format(selectedDay, "MMMM d")}</h4>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Activities for this date</p>
            </div>
            <button 
              onClick={closePeek}
              className="p-3 rounded-2xl bg-white/5 text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
            {getDayTransactions(selectedDay).map(tx => {
              const styles = getSourceStyles(tx.type);
              const Icon = styles.icon;
              return (
                <button 
                  key={tx.id}
                  onClick={() => setViewingItem(tx)}
                  className={cn(
                    "w-full p-6 rounded-3xl border transition-all flex items-center gap-5 text-left group",
                    viewingItem?.id === tx.id 
                      ? "bg-white/10 border-white/20 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] scale-[1.02]" 
                      : "bg-black/40 border-white/5 hover:border-white/20"
                  )}
                >
                  <div className={cn("p-4 rounded-2xl border transition-all group-hover:rotate-12", styles.color, styles.bg, styles.border)}>
                     <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 truncate">
                    <h5 className="font-bold text-base truncate tracking-tight">{tx.name}</h5>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{styles.label} • {tx.source}</p>
                  </div>
                  <ArrowRight className={cn("w-5 h-5 transition-all opacity-20", viewingItem?.id === tx.id ? "opacity-100 translate-x-0" : "-translate-x-3 group-hover:opacity-60")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail View (Stage 2) - Visible only if item selected on mobile */}
        <div className={cn(
          "flex-1 h-full relative overflow-hidden flex flex-col bg-black transition-all duration-300",
          viewingItem ? "flex" : "hidden lg:flex"
        )}>
           {/* Top Bar for Mobile Detail View */}
           <div className="lg:hidden p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <button 
                onClick={() => setViewingItem(null)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Back to List
              </button>
              <button onClick={closePeek} className="p-2 rounded-xl bg-white/5">
                 <X className="w-5 h-5" />
              </button>
           </div>

           <button 
             onClick={closePeek}
             className="absolute top-10 right-10 z-[100] p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all hidden lg:block"
           >
             <X className="w-6 h-6" />
           </button>

           {viewingItem ? (
             <div ref={modalContentRef} className="h-full flex-1 flex flex-col p-8 md:p-14 overflow-y-auto custom-scrollbar">
                {/* Item Profile */}
                <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10 mb-10 md:mb-16">
                   <div className={cn("p-6 md:p-8 rounded-[32px] md:rounded-[40px] border shadow-2xl", getSourceStyles(viewingItem.type).bg, getSourceStyles(viewingItem.type).border, getSourceStyles(viewingItem.type).color)}>
                      {React.createElement(getSourceStyles(viewingItem.type).icon, { className: "w-8 h-8 md:w-12 md:h-12" })}
                   </div>
                   <div className="flex-1 pt-0 md:pt-4">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-3">
                         <span className={cn("px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]", getSourceStyles(viewingItem.type).bg, getSourceStyles(viewingItem.type).color)}>
                           {getSourceStyles(viewingItem.type).label}
                         </span>
                         <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-30 border-l border-white/10 pl-3 md:pl-4">Collection: {viewingItem.source}</span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight mb-4">{viewingItem.name}</h2>
                      <p className="text-muted-foreground text-[10px] md:text-sm font-medium opacity-50 flex items-center gap-2">
                         <Clock className="w-4 h-4 md:w-5 md:h-5" />
                         Captured on {format(viewingItem.date, "PPP p")}
                      </p>
                   </div>
                </div>

                {/* Data Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-16">
                   <DetailBox label="System Registry" value={viewingItem.originalData.id?.slice(0, 15)} icon={Tag} />
                   
                   {viewingItem.source === "stones" && (
                     <>
                       <DetailBox label="Current Status" value={viewingItem.originalData.status} icon={Gem} color={viewingItem.originalData.status === "Sold" ? "text-amber-400" : "text-emerald-400"} />
                       <DetailBox label="Stone Weight" value={`${viewingItem.originalData.weight || viewingItem.originalData.weightInRough} ct`} icon={Weight} />
                       <DetailBox label="Inventory Cost" value={`LKR ${viewingItem.originalData.totalCost?.toLocaleString()}`} icon={DollarSign} />
                       {viewingItem.type === "sell" && (
                         <>
                           <DetailBox label="Checkout Price" value={`LKR ${viewingItem.originalData.soldPrice?.toLocaleString()}`} icon={TrendingUp} color="text-amber-400" />
                           <DetailBox label="Net Profitability" value={`LKR ${viewingItem.originalData.profitLoss?.toLocaleString()}`} icon={TrendingUp} color="text-emerald-400" />
                         </>
                       )}
                     </>
                   )}

                   {(viewingItem.source === "remainders" || viewingItem.source === "archives") && (
                     <>
                       <DetailBox label="Associated Party" value={viewingItem.originalData.buyerName || viewingItem.originalData.ownerName || "Direct Transaction"} icon={User} />
                       <DetailBox label="Business Type" value={viewingItem.originalData.buyerType || viewingItem.originalData.stoneOwner} icon={Info} />
                       <DetailBox label="Valuation" value={`LKR ${viewingItem.amount?.toLocaleString()}`} icon={DollarSign} />
                       <DetailBox label="Party Receives" value={viewingItem.originalData.partyReceives ? `LKR ${viewingItem.originalData.partyReceives.toLocaleString()}` : "---"} icon={ExternalLink} color="text-amber-400" />
                       {viewingItem.originalData.myProfit && <DetailBox label="Accounted Profit" value={`LKR ${viewingItem.originalData.myProfit.toLocaleString()}`} icon={TrendingUp} color="text-emerald-400" />}
                       {viewingItem.originalData.durationInDays && <DetailBox label="Lifecycle" value={`${viewingItem.originalData.durationInDays} days duration`} icon={Clock} />}
                     </>
                   )}
                </div>

                {/* Receipt Image / Gallery */}
                {(viewingItem.originalData.receiptImage || (viewingItem.originalData.images && viewingItem.originalData.images.length > 0)) && (
                  <div className="mt-auto">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-30 mb-6">Verification Documents</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="relative group/img rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/5 bg-white/5 aspect-video w-full">
                         <img 
                           src={viewingItem.originalData.receiptImage || viewingItem.originalData.images?.[0]} 
                           className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" 
                           alt="Activity Document"
                         />
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button className="p-4 md:p-5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-primary transition-all shadow-2xl">
                               <Maximize2 className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-12">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-dashed border-white/10 flex items-center justify-center mb-8 bg-secondary/5">
                   <Maximize2 className="w-12 h-12 md:w-16 md:h-16 opacity-10 animate-pulse" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">Ready for Review</h3>
                <p className="max-w-[350px] text-sm md:text-base font-medium text-muted-foreground opacity-60">Select an item from the sidebar to visualize the comprehensive stone event logs.</p>
             </div>
           )}
        </div>

      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="bg-background/20 backdrop-blur-3xl border border-border/40 rounded-[48px] overflow-hidden shadow-2xl h-full flex flex-col relative">
      {/* Calendar Header */}
      <div className="p-8 pb-4 flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-3 text-white">
             Stone Activity
             <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
             </div>
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Global Inventory Events</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-secondary/30 rounded-2xl border border-white/5">
           <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2.5 rounded-xl hover:bg-background/50 transition-all text-muted-foreground hover:text-foreground">
             <ChevronLeft className="w-5 h-5" />
           </button>
           <span className="text-xs font-black min-w-[120px] text-center uppercase tracking-widest text-white">
             {format(currentDate, "MMMM yyyy")}
           </span>
           <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2.5 rounded-xl hover:bg-background/50 transition-all text-muted-foreground hover:text-foreground">
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Grid */}
      <div ref={calendarRef} className="flex-1 p-8 pt-4 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-7 gap-3">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-center text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest mb-4">{d}</div>
          ))}
          {paddingDays.map((_, i) => <div key={`p-${i}`} className="aspect-square" />)}
          {daysInMonth.map(day => {
            const txs = getDayTransactions(day);
            const isSel = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "calendar-day aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 group relative",
                  isToday(day) ? "bg-primary/10 border-primary/30" : "bg-secondary/5 border-white/5 hover:border-white/10 hover:bg-secondary/20",
                  isSel ? "ring-2 ring-primary border-primary bg-secondary/30" : ""
                )}
              >
                <span className={cn("text-xs font-black", isToday(day) ? "text-primary" : "text-foreground/60 group-hover:text-foreground transition-colors")}>
                  {format(day, "d")}
                </span>
                <div className="flex gap-0.5">
                   {Array.from(new Set(txs.map(t => t.type))).slice(0, 3).map((type, i) => (
                     <div key={i} className={cn("w-1 h-1 rounded-full", 
                        type === "buy" ? "bg-emerald-400" : 
                        type === "sell" ? "bg-amber-400" : 
                        type === "reminder" ? "bg-blue-400" : "bg-purple-400")} />
                   ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDER MODAL VIA PORTAL */}
      {modal}
    </div>
  );
}

function getSourceStyles(type: string) {
  switch(type) {
    case "buy": return { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: ShoppingCart, label: "Purchase" };
    case "sell": return { color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: TrendingUp, label: "Sale" };
    case "reminder": return { color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", icon: Bell, label: "Reminder" };
    case "archive": return { color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", icon: Archive, label: "Archive" };
    default: return { color: "text-muted-foreground", bg: "bg-secondary/50", border: "border-border", icon: Info, label: "Activity" };
  }
}

function DetailBox({ label, value, icon: Icon, color = "text-foreground" }: { label: string, value: string | number | undefined, icon: any, color?: string }) {
  return (
    <div className="p-5 md:p-6 rounded-3xl bg-secondary/10 border border-white/5 group hover:border-white/20 hover:bg-secondary/20 transition-all">
       <div className="flex items-center gap-3 mb-3">
          <Icon className="w-4 h-4 text-muted-foreground/40" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-50">{label}</span>
       </div>
       <p className={cn("text-base md:text-lg font-bold tracking-tight", color)}>{value || "---"}</p>
    </div>
  );
}
