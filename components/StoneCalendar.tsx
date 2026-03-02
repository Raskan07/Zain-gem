"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, ShoppingCart, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, Timestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StoneTransaction {
  id: string;
  name: string;
  type: "buy" | "sell";
  amount: number;
  date: Date;
  weight?: number;
}

export function StoneCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<StoneTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Real-time listener for stone transactions
  useEffect(() => {
    const q = query(collection(db, "stones"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: StoneTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt = new Date();
        try {
          if (data.createdAt instanceof Timestamp) createdAt = data.createdAt.toDate();
          else if (data.createdAt instanceof Date) createdAt = data.createdAt;
          else if (data.createdAt?.toDate) createdAt = data.createdAt.toDate();
        } catch (e) {
          console.warn("Calendar Date parsing error (createdAt):", e);
        }
        
        // Add "Buy" transaction for every stone created
        txs.push({
          id: `${doc.id}-buy`,
          name: data.name,
          type: "buy",
          amount: data.stoneCost || 0,
          date: createdAt,
          weight: data.weightInRough
        });

        // Add "Sell" transaction if stone is sold
        if (data.status === "Sold" && data.updatedAt) {
          let soldAt = new Date();
          try {
            if (data.updatedAt instanceof Timestamp) soldAt = data.updatedAt.toDate();
            else if (data.updatedAt instanceof Date) soldAt = data.updatedAt;
            else if (data.updatedAt?.toDate) soldAt = data.updatedAt.toDate();
          } catch (e) {
            console.warn("Calendar Date parsing error (updatedAt):", e);
          }

          txs.push({
            id: `${doc.id}-sell`,
            name: data.name,
            type: "sell",
            amount: data.soldPrice || 0,
            date: soldAt,
            weight: data.weight
          });
        }
      });
      setTransactions(txs);
    });

    return () => unsubscribe();
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const getDayTransactions = (day: Date) => {
    return transactions.filter((tx) => isSameDay(tx.date, day));
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  useEffect(() => {
    if (calendarRef.current) {
      gsap.from(calendarRef.current.querySelectorAll(".calendar-day"), {
        scale: 0.8,
        opacity: 0,
        duration: 0.4,
        stagger: 0.01,
        ease: "power2.out"
      });
    }
  }, [currentDate]);

  return (
    <div className="bg-card backdrop-blur-xl border border-border rounded-[32px] overflow-hidden shadow-2xl h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Stone Activity</h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold min-w-[100px] text-center text-foreground">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div ref={calendarRef} className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {day}
            </div>
          ))}
          {daysInMonth.map((day, i) => {
            const dayTxs = getDayTransactions(day);
            const hasBuy = dayTxs.some(t => t.type === "buy");
            const hasSell = dayTxs.some(t => t.type === "sell");
            
            return (
              <button
                key={day.toString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "calendar-day aspect-square rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all relative group overflow-hidden",
                  isToday(day) ? "border-primary/50 bg-primary/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : "border-transparent hover:border-white/10 hover:bg-white/5",
                  dayTxs.length > 0 ? "shadow-inner" : ""
                )}
              >
                <span className={cn(
                  "text-xs font-bold",
                  isToday(day) ? "text-primary" : "text-foreground/80"
                )}>
                  {format(day, "d")}
                </span>
                
                {/* Visual Indicators */}
                <div className="flex gap-1">
                  {hasBuy && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-500",
                      hasSell ? "bg-cyan-400 scale-125" : "bg-green-500"
                    )} />
                  )}
                  {hasSell && !hasBuy && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                  )}
                  {hasBuy && hasSell && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-cyan-400 rounded-bl-xl shadow-lg animate-pulse" />
                  )}
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors pointer-events-none" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Window (Dialog) */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="bg-card backdrop-blur-3xl border-border text-foreground rounded-[40px] shadow-2xl max-w-md animate-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {selectedDate && format(selectedDate, "EEE, MMMM d")}
              <div className="h-6 w-1 bg-primary rounded-full" />
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            {selectedDate && getDayTransactions(selectedDate).length > 0 ? (
              getDayTransactions(selectedDate).map((tx) => (
                <div key={tx.id} className="p-5 rounded-[24px] bg-secondary/50 border border-white/5 flex items-center justify-between group hover:bg-secondary transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl flex items-center justify-center",
                      tx.type === "buy" ? "bg-green-500/10 text-green-500" : "bg-primary/10 text-primary"
                    )}>
                      {tx.type === "buy" ? <ShoppingCart className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-md leading-tight">{tx.name}</h4>
                      <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mt-1">
                        {tx.type === "buy" ? "Purchased" : "Sold"} • {tx.weight} ct
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-md font-bold text-foreground">LKR {tx.amount.toLocaleString()}</div>
                    <div className="flex items-center justify-end gap-1 mt-1">
                       <Info className="w-3 h-3 text-muted-foreground/40" />
                       <span className="text-[10px] text-muted-foreground/60 font-medium">Auto-synced</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                 <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                    <ClockIcon className="w-8 h-8 text-muted-foreground/30" />
                 </div>
                 <h4 className="text-lg font-bold text-foreground/80">No Transactions</h4>
                 <p className="text-sm text-muted-foreground max-w-[200px] mt-2">There were no stone activities recorded for this date.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
