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

const data = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 120 },
  { name: 'Mar', value: 150 },
  { name: 'Apr', value: 140 },
  { name: 'May', value: 170 },
  { name: 'Jun', value: 200 },
  { name: 'Jul', value: 180 },
  { name: 'Aug', value: 210 },
  { name: 'Sep', value: 190 },
  { name: 'Oct', value: 230 },
  { name: 'Nov', value: 250 },
];

export function HiringStatistics() {
  return (
    <div className="p-8 bg-background border border-border rounded-3xl shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-foreground">Hiring Statistics</h3>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Others</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Design</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <select className="text-xs font-bold text-muted-foreground bg-transparent border-none focus:ring-0 cursor-pointer">
                <option>2024</option>
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
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
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
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#FFD700" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
            />
            <Line 
              type="monotone" 
              dataKey="value" 
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
