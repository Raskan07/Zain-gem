"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, where, Timestamp } from "firebase/firestore";
import { format, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, ChevronLeft, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface LogItem {
  id: string;
  title: string;
  date: string;
  timestamp: any;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    let q;
    if (date) {
      const start = startOfDay(date);
      const end = endOfDay(date);
      q = query(
        collection(db, "activity_logs"),
        where("timestamp", ">=", Timestamp.fromDate(start)),
        where("timestamp", "<=", Timestamp.fromDate(end)),
        orderBy("timestamp", "desc")
      );
    } else {
      q = query(
        collection(db, "activity_logs"),
        orderBy("timestamp", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: LogItem[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as LogItem);
      });
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [date]);

  return (
    <div className="p-3 md:p-6 flex flex-col h-full bg-background/30">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.back()}
            className="rounded-xl border-border hover:bg-secondary/50 grayscale opacity-70 hover:opacity-100 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Activity Audit</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Detailed Activity Logs</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-medium rounded-2xl border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-all",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-3xl border-border bg-card/95 backdrop-blur-xl" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  if (newDate) {
                    setDate(newDate);
                  }
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {date && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setDate(undefined)}
              className="rounded-xl hover:bg-primary/10 text-primary transition-all"
              title="Reset Filter"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing logs...</p>
            </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center space-y-4 bg-secondary/5 rounded-[40px] border border-dashed border-border/50">
            <div className="p-4 rounded-full bg-secondary/10">
                <ClipboardList className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div>
                <p className="text-lg font-bold text-foreground">No activities found</p>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-1">
                    {date 
                      ? `We couldn't find any logs for ${format(date, "MMMM do, yyyy")}.` 
                      : "The activity stream is currently empty."}
                </p>
            </div>
            {date && (
                <Button variant="link" onClick={() => setDate(undefined)} className="text-primary hover:text-primary/80">
                    Clear date filter
                </Button>
            )}
          </div>
        ) : (
          <div className="relative pl-4 ml-2 border-l border-border/50 space-y-2 pb-12">
            {logs.map((log, index) => (
              <div 
                key={log.id} 
                className="group relative pl-8 py-3 bg-secondary/5 border border-transparent hover:border-primary/20 hover:bg-secondary/10 rounded-2xl transition-all duration-300"
              >
                {/* Timeline Dot */}
                <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-background border-2 border-primary shadow-[0_0_10px_rgba(var(--primary),0.4)] group-hover:scale-125 transition-transform" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-foreground leading-none group-hover:text-primary transition-colors truncate">
                      {log.title}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/20 border border-border/30">
                      <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tighter">
                        {log.date.includes(',') ? log.date.split(',')[0].trim() : log.date}
                      </span>
                    </div>
                    {log.date.includes(',') && (
                      <div className="px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
                        <span className="text-[10px] font-black text-primary/80 tracking-tight">
                          {log.date.split(',')[1].trim()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
