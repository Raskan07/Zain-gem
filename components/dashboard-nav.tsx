"use client";

import React, { useState } from "react";
import { Search, Bell, Settings, User, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ProfileModal } from "./ProfileModal";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Remainders", href: "/dashboard/remainders" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Sales", href: "/dashboard/sales" },
  { label: "Settings", href: "/dashboard/settings" },
  { label: "Stones", href: "/dashboard/stones" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget;
    gsap.to(target, {
      scale: 0.95,
      opacity: 0.7,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    });
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 md:px-12 md:py-8 w-full max-w-[1600px] mx-auto z-50 relative">
      <div className="flex items-center gap-6 md:gap-12">
        <Link href="/dashboard" className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Crextio
        </Link>
        <nav className="hidden lg:flex items-center gap-1 bg-secondary/40 backdrop-blur-md p-1.5 rounded-full border border-white/5 shadow-2xl">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="hidden sm:flex items-center gap-3 md:gap-5">
            <button className="p-3 rounded-full bg-secondary border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all shadow-sm">
            <Settings className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-full bg-secondary border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all shadow-sm">
            <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="p-3 rounded-full bg-secondary border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all shadow-sm"
            >
            <User className="w-5 h-5" />
            </button>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          className="lg:hidden p-3 rounded-full bg-secondary border border-white/5 text-foreground shadow-sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 mt-4 mx-6 p-6 bg-white/95 backdrop-blur-xl rounded-[32px] border border-white/40 shadow-2xl lg:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 z-50">
           {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleClick}
                className={cn(
                  "px-8 py-4 rounded-2xl text-lg font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(234,179,8,0.2)]"
                    : "text-muted-foreground bg-secondary/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="flex items-center justify-around pt-6 border-t border-gray-100 mt-2">
            <Settings className="w-6 h-6 text-muted-foreground" />
            <Bell className="w-6 h-6 text-muted-foreground" />
            <button onClick={() => setIsProfileModalOpen(true)}>
              <User className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </header>
  );
}
