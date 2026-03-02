"use client";

import React, { useEffect, useRef } from "react";
import { Users, UserPlus, Briefcase } from "lucide-react";
import gsap from "gsap";

const stats = [
  { label: "Employee", value: 91, icon: Users },
  { label: "Hirings", value: 104, icon: UserPlus },
  { label: "Projects", value: 185, icon: Briefcase },
];

export function DashboardStats() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const items = containerRef.current.querySelectorAll(".stat-item");
      gsap.from(items, {
        x: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });

      // Animate numbers
      stats.forEach((stat, i) => {
        const obj = { val: 0 };
        const el = containerRef.current?.querySelectorAll(".stat-value")[i];
        if (el) {
          gsap.to(obj, {
            val: stat.value,
            duration: 2,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = Math.floor(obj.val).toString();
            },
          });
        }
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="flex items-center justify-between p-10 py-8">
      {stats.map((stat, index) => (
        <div key={index} className="stat-item flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-background border border-border shadow-sm text-foreground">
            <stat.icon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="stat-value text-5xl font-bold text-foreground">0</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
