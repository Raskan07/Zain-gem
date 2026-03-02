"use client";

import React from "react";
import { ValentinaHero } from "@/components/ValentinaHero";
import { DashboardStats } from "@/components/DashboardStats";
import { ScheduleCard } from "@/components/ScheduleCard";
import { SalaryTable } from "@/components/SalaryTable";
import { HiringStatistics } from "@/components/HiringStatistics";
import { EmployeeComposition } from "@/components/EmployeeComposition";
import { StoneCalendar } from "@/components/StoneCalendar";

export default function Dashboard() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr_450px] min-h-[90vh]">
      {/* Left Column - Schedule - Visible on lg screens */}
      <div className="p-8 border-r border-border hidden lg:block bg-secondary/5">
        <ScheduleCard />
      </div>

      {/* Center Column - Main Content */}
      <div className="flex flex-col min-w-0">
        <ValentinaHero />
        <div className="p-6 md:p-12 space-y-12">
            <SalaryTable />
            <div className="bg-card backdrop-blur-md p-6 md:p-10 rounded-[40px] border border-border shadow-xl">
                <HiringStatistics />
            </div>
        </div>
      </div>

      {/* Right Column - Stats & Extra Info - Below on small screens */}
      <div className="border-t lg:border-t-0 lg:border-l border-border flex flex-col bg-secondary/10">
        <DashboardStats />
        <div className="p-6 md:p-12 pt-0 space-y-12 flex-1">
            <div className="h-[480px]">
                <StoneCalendar />
            </div>
            <div className="h-[420px]">
                <EmployeeComposition />
            </div>
        </div>
      </div>
    </div>
  );
}
