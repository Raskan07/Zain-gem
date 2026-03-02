"use client";

import React from "react";
import { Search, ArrowUpRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const employees = [
  { id: 1, name: "Yulia Polishchuk", role: "Head of Design", salary: "$2,500", status: "Paid For", statusColor: "text-blue-400", bgColor: "bg-blue-400/10" },
  { id: 2, name: "Bogdan Nikitin", role: "Front End Dev...", salary: "$3,000", status: "Absent", statusColor: "text-muted-foreground", bgColor: "bg-muted/10", selected: true },
  { id: 3, name: "Daria Yurchenko", role: "UX/UI Designer", salary: "$1,500", status: "Pending", statusColor: "text-primary", bgColor: "bg-primary/10" },
];

export function SalaryTable() {
  return (
    <div className="p-8 bg-background border border-border rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground">Salary</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
             <input 
               type="text" 
               placeholder="Search" 
               className="pl-10 pr-4 py-2 rounded-full bg-background border border-border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring w-48 shadow-sm text-foreground"
             />
          </div>
          <button className="p-2 rounded-full border border-border text-muted-foreground">
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
            <div></div>
            <div>Name</div>
            <div>Job Title</div>
            <div>Net Salary</div>
            <div>Status</div>
        </div>

        {employees.map((emp) => (
          <div 
            key={emp.id} 
            className={cn(
                "grid grid-cols-[30px_1fr_1fr_1fr_1fr] items-center px-4 py-3 rounded-2xl transition-all border",
                emp.selected ? "border-border bg-background shadow-sm" : "border-transparent"
            )}
          >
            <div className="flex items-center justify-center">
                <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    emp.selected ? "bg-foreground border-foreground" : "border-border"
                )}>
                    {emp.selected && <Check className="w-2.5 h-2.5 text-background" />}
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary overflow-hidden border border-white/5">
                    {/* Placeholder for profile pic */}
                    <div className="w-full h-full bg-gradient-to-br from-white/10 to-white/5" />
                </div>
                <span className="text-sm font-bold text-foreground">{emp.name}</span>
            </div>
            <div className="text-xs font-semibold text-muted-foreground">{emp.role}</div>
            <div className="text-sm font-bold text-foreground">{emp.salary}</div>
            <div className="flex items-center">
                <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                    emp.bgColor,
                    emp.statusColor
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", emp.statusColor.replace('text', 'bg'))} />
                    {emp.status}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
