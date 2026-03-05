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
    <div className="p-6 md:p-12 flex flex-col h-full bg-background/30">
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
          <div className="flex flex-col items-center justify-center h-80 text-center space-y-4 bg-secondary/5 rounded-[40px] border border-dashed border-border/50">
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
          <div className="grid grid-cols-1 gap-4 pb-8">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="group relative p-6 bg-card border border-border/40 rounded-[28px] hover:border-primary/30 hover:bg-secondary/10 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                        <h4 className="text-sm font-bold text-foreground leading-relaxed group-hover:text-primary transition-colors">
                            {log.title}
                        </h4>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/60 pl-5">
                        <span className="flex items-center gap-1.5">
                            {log.date.includes(',') ? log.date.split(',')[0] : log.date}
                        </span>
                        {log.date.includes(',') && <span className="w-1 h-1 rounded-full bg-border" />}
                        {log.date.includes(',') && (
                          <span className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-md">
                              {log.date.split(',')[1]}
                          </span>
                        )}
                    </div>
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
