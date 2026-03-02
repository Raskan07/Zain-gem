"use client";

import { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-primary/15 to-transparent blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <DashboardNav />
        <main className="flex-1 px-4 md:px-8 pb-12 w-full max-w-[1600px] mx-auto">
          <div className="bg-card backdrop-blur-xl rounded-[32px] md:rounded-[48px] border border-border shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden min-h-[90vh]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
