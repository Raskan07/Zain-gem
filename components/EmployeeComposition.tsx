"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Gem, ShoppingCart } from "lucide-react";

interface EmployeeCompositionProps {
  inStock: number;
  sold: number;
  total: number;
}

export function EmployeeComposition({ inStock, sold, total }: EmployeeCompositionProps) {
  const data = [
    { name: 'In Stock', value: inStock, color: '#FFD700' },
    { name: 'Sold', value: sold, color: '#2D2D2D' },
  ];

  const inStockPercentage = total > 0 ? Math.round((inStock / total) * 100) : 0;
  const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <div className="p-8 bg-background border border-border rounded-3xl shadow-sm h-full flex flex-col items-center justify-center text-center">
      <h3 className="text-xl font-bold text-foreground mb-6">Collection Composition</h3>
      
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
          <span className="text-4xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Items</span>
        </div>
      </div>

      <div className="flex gap-8 items-center justify-center">
        <div className="flex items-center gap-2">
           <Gem className="w-4 h-4 text-yellow-400" />
           <span className="text-sm font-bold text-foreground">{inStockPercentage}%</span>
           <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">In Stock</span>
        </div>
        <div className="flex items-center gap-2">
           <ShoppingCart className="w-4 h-4 text-foreground/40" />
           <span className="text-sm font-bold text-foreground">{soldPercentage}%</span>
           <span className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Sold</span>
        </div>
      </div>
    </div>
  );
}
