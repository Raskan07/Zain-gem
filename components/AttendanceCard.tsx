"use client";

import React, { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";

export function AttendanceCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const dots = containerRef.current.querySelectorAll(".attendance-dot");
      gsap.from(dots, {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: {
          grid: [4, 10],
          from: "start",
          amount: 1
        },
        ease: "back.out(1.7)"
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="p-8 bg-[#2D2D2D] rounded-3xl shadow-xl h-full text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-medium text-white/80">Attendance Report</h3>
        <button className="p-2 rounded-full border border-white/10 text-white/60">
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-baseline gap-4 mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">63</span>
          <span className="text-yellow-400">↗</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white/60">12</span>
          <span className="text-white/40">↘</span>
        </div>
      </div>

      {/* Attendance Dots Grid */}
      <div className="grid grid-cols-10 gap-3">
        {Array.from({ length: 40 }).map((_, i) => (
          <div 
            key={i} 
            className="attendance-dot w-2.5 h-2.5 rounded-full"
            style={{ 
              backgroundColor: i < 25 ? (i % 3 === 0 ? "#FFD700" : "#4A4A4A") : "#4A4A4A" 
            }}
          />
        ))}
      </div>
    </div>
  );
}
