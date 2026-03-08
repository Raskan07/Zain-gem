"use client";

import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { ArrowUpRight } from "lucide-react";


interface HiringStatisticsProps {
  data: any[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

export function HiringStatistics({ data, selectedYear, onYearChange }: HiringStatisticsProps) {
  const years = [2023, 2024, 2025, 2026];

  return (
    <div className="p-8 bg-background border border-border rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground">Sales & Inventory Trends</h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Inventory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Sales</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <select 
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="text-xs font-bold text-muted-foreground bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-4"
              style={{ background: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E") no-repeat right center', backgroundSize: '12px' }}
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="p-2 rounded-full border border-border text-muted-foreground">
                <ArrowUpRight className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
              formatter={(value: any) => [`LKR ${value?.toLocaleString()}`, '']}
            />
            <Area 
                type="monotone" 
                dataKey="inventory" 
                stroke="#FFD700" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorInventory)" 
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#2D2D2D" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
