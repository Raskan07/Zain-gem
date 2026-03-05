"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

interface LogItem {
  id: string;
  title: string;
  date: string;
  timestamp: any;
}

export function LogsCard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData: LogItem[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as LogItem);
      });
      setLogs(logsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (containerRef.current && logs.length > 0) {
      gsap.from(containerRef.current.querySelectorAll(".log-item"), {
        x: -20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, [logs]);

  return (
    <div ref={containerRef} className="p-8 bg-background border border-border rounded-3xl shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <ClipboardList className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Activity Logs</h3>
        </div>
        <button className="p-2 rounded-full border border-border text-muted-foreground hover:bg-secondary transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6 relative ml-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-6 bottom-6 w-[1px] bg-border dashed-border" />

        {loading ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                Loading logs...
            </div>
        ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center space-y-2">
                <p className="text-muted-foreground text-sm font-medium">No activities recorded yet</p>
                <p className="text-[10px] text-muted-foreground/60">New events will appear here automatically</p>
            </div>
        ) : (
            logs.map((item, index) => (
              <div key={item.id} className="log-item relative pl-8 flex items-start gap-4">
                 {/* Timeline dot */}
                 <div 
                   className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center bg-primary"
                 >
                   <div className="w-1.5 h-1.5 rounded-full bg-background" />
                 </div>
    
                 <div className="flex-1">
                    <p className="text-xs font-bold text-foreground leading-tight">
                      {item.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {item.date}
                    </p>
                 </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
