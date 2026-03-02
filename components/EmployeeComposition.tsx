"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Male', value: 70, color: '#FFD700' },
  { name: 'Female', value: 30, color: '#E0E0E0' },
];

export function EmployeeComposition() {
  return (
    <div className="p-8 bg-background border border-border rounded-3xl shadow-sm h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-xl font-bold text-foreground mb-6">Employee Composition</h3>
      
      <div className="relative w-48 h-48 mx-auto mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              startAngle={180}
              endAngle={-180}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-foreground">345</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="flex gap-8 items-center justify-center">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-yellow-400" />
           <span className="text-sm font-bold text-foreground">70%</span>
           <span className="text-muted-foreground">♂</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-secondary" />
           <span className="text-sm font-bold text-foreground">30%</span>
           <span className="text-muted-foreground">♀</span>
        </div>
      </div>
    </div>
  );
}
