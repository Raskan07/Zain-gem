"use client";

import React, { useEffect, useState } from "react";
import { ValentinaHero } from "@/components/ValentinaHero";
import { DashboardStats } from "@/components/DashboardStats";
import { LogsCard } from "@/components/LogsCard";
import { NotesCard } from "@/components/NotesCard";
import { HiringStatistics } from "@/components/HiringStatistics";
import { EmployeeComposition } from "@/components/EmployeeComposition";
import { StoneCalendar } from "@/components/StoneCalendar";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";

export default function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStones: 0,
    soldStones: 0,
    inStock: 0,
    soldPercentage: 0,
    activeVault: 0,
    recentTrades: 0,
    gemRecords: 0
  });

  useEffect(() => {
    // Helper to initialize monthly data
    const getInitialMonthlyData = () => [
      { name: 'Jan', sales: 0, inventory: 0 },
      { name: 'Feb', sales: 0, inventory: 0 },
      { name: 'Mar', sales: 0, inventory: 0 },
      { name: 'Apr', sales: 0, inventory: 0 },
      { name: 'May', sales: 0, inventory: 0 },
      { name: 'Jun', sales: 0, inventory: 0 },
      { name: 'Jul', sales: 0, inventory: 0 },
      { name: 'Aug', sales: 0, inventory: 0 },
      { name: 'Sep', sales: 0, inventory: 0 },
      { name: 'Oct', sales: 0, inventory: 0 },
      { name: 'Nov', sales: 0, inventory: 0 },
      { name: 'Dec', sales: 0, inventory: 0 },
    ];

    const unsubscribes: (() => void)[] = [];
    const rawData: any = { stones: [], remainders: [], archives: [] };

    const updateTrends = () => {
      const monthlyData = getInitialMonthlyData();
      
      // Aggregate Sales (Remainders & Archives)
      [...rawData.remainders, ...rawData.archives].forEach(item => {
        const date = item.sellingDate?.toDate?.() || item.paymentReceivingDate?.toDate?.() || item.archivedAt?.toDate?.() || item.date?.toDate?.();
        if (date && date.getFullYear() === selectedYear) {
          const month = date.getMonth(); // 0-11
          monthlyData[month].sales += (item.sellingPrice || item.soldPrice || 0);
        }
      });

      // Aggregate Inventory (Stones)
      rawData.stones.forEach((item: any) => {
        const date = item.createdAt?.toDate?.() || item.date?.toDate?.();
        if (date && date.getFullYear() === selectedYear) {
          const month = date.getMonth();
          monthlyData[month].inventory += (item.stoneCost || item.totalCost || 0);
        }
      });

      setChartData(monthlyData);
    };

    // 1. Listen to Stones collection
    unsubscribes.push(onSnapshot(collection(db, "stones"), (snapshot) => {
      const allStones = snapshot.docs.map(doc => doc.data());
      rawData.stones = allStones;
      
      const total = allStones.length;
      const sold = allStones.filter(s => s.status === "Sold").length;
      const inStock = allStones.filter(s => s.status === "In Stock" || !s.status).length;
      
      setStats(prev => ({
        ...prev,
        totalStones: total,
        soldStones: sold,
        inStock: inStock,
        soldPercentage: total > 0 ? (sold / total) * 100 : 0,
        gemRecords: total
      }));
      updateTrends();
    }));

    // 2. Listen to Remainders
    unsubscribes.push(onSnapshot(collection(db, "remainders"), (snapshot) => {
      rawData.remainders = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        activeVault: snapshot.docs.length
      }));
      updateTrends();
    }));

    // 3. Listen to Archives
    unsubscribes.push(onSnapshot(collection(db, "archives"), (snapshot) => {
      rawData.archives = snapshot.docs.map(doc => doc.data());
      setStats(prev => ({
        ...prev,
        recentTrades: snapshot.docs.length
      }));
      updateTrends();
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [selectedYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_450px] min-h-[90vh]">
      {/* Activity Logs - Visible on all screens, appears at the end on mobile */}
      <div className="p-8 border-t lg:border-t-0 lg:border-r border-border bg-secondary/5 order-last lg:order-first">
        <LogsCard />
      </div>

      {/* Center Column - Main Content */}
      <div className="flex flex-col min-w-0">
        <ValentinaHero 
          totalStones={stats.totalStones} 
          soldStones={stats.soldStones} 
          soldPercentage={stats.soldPercentage}
        />
        <div className="p-6 md:p-12 space-y-12">
            <NotesCard />
            <div className="bg-card backdrop-blur-md p-6 md:p-10 rounded-[40px] border border-border shadow-xl">
                <HiringStatistics 
                  data={chartData} 
                  selectedYear={selectedYear} 
                  onYearChange={setSelectedYear} 
                />
            </div>
        </div>
      </div>

      {/* Right Column - Stats & Extra Info - Below on small screens */}
      <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-secondary/10">
        <DashboardStats 
          activeVault={stats.activeVault}
          recentTrades={stats.recentTrades}
          gemRecords={stats.gemRecords}
        />
        <div className="p-6 md:p-12 pt-0 space-y-12 flex-1">
            <div className="h-[480px]">
                <StoneCalendar />
            </div>
            <div className="h-[420px]">
                <EmployeeComposition 
                  inStock={stats.inStock}
                  sold={stats.soldStones}
                  total={stats.totalStones}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
