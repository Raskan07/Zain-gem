"use client";

import React, { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

const scheduleItems = [
  { time: "09:00", active: true, dotColor: "#2D2D2D" },
  { 
    time: "10:00", 
    dotColor: "#E0E0E0",
    event: {
      title: "Daily Sync",
      subtitle: "09:30am - 10:00am",
      color: "#2D2D2D",
      textColor: "text-white"
    }
  },
  { time: "11:00", dotColor: "#FFD700" },
  { 
    time: "12:00", 
    dotColor: "#E0E0E0",
    event: {
      title: "Task Review With Team",
      subtitle: "10:30am - 11:30am",
      color: "transparent",
      border: "border-gray-100",
      textColor: "text-[#2D2D2D]"
    }
  },
  { time: "01:00", dotColor: "#FFD700" },
  { 
    time: "02:00", 
    dotColor: "#E0E0E0",
    event: {
      title: "Daily Meeting",
      subtitle: "12:00pm - 01:00pm",
      color: "transparent",
      border: "border-gray-100",
      textColor: "text-[#2D2D2D]"
    }
  },
  { time: "03:00", dotColor: "#2D2D2D" },
];

export function ScheduleCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      gsap.from(containerRef.current.querySelectorAll(".schedule-item"), {
        x: -20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="p-8 bg-background border border-border rounded-3xl shadow-sm h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground">Schedule</h3>
        <button className="p-2 rounded-full border border-border text-muted-foreground">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6 relative ml-2">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-6 bottom-6 w-[1px] bg-border dashed-border" />

        {scheduleItems.map((item, index) => (
          <div key={index} className="schedule-item relative pl-8 flex items-start gap-4">
             {/* Timeline dot */}
             <div 
               className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-background shadow-sm flex items-center justify-center bg-background"
               style={{ backgroundColor: item.dotColor }}
             >
               <div className="w-1.5 h-1.5 rounded-full bg-background" />
             </div>

             <span className="text-xs font-bold text-muted-foreground min-w-[40px] mt-1">
               {item.time}
             </span>

             {item.event && (
               <div 
                 className={cn(
                   "flex-1 p-4 rounded-2xl shadow-sm",
                   item.event.border || "border-none"
                 )}
                 style={{ backgroundColor: item.event.color }}
               >
                 <h4 className={cn("text-xs font-bold", item.event.textColor)}>
                   {item.event.title}
                 </h4>
                 <p className={cn("text-[10px] opacity-60 mt-0.5", item.event.textColor)}>
                   {item.event.subtitle}
                 </p>
               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
