"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { 
  Home, 
  Gem, 
  ShoppingCart, 
  Bell, 
  BarChart3,
  Settings,
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    router.push('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    { icon: Home, label: "HOME", href: "/dashboard", active: pathname === "/dashboard" },
    { icon: Gem, label: "STONES", href: "/dashboard/stones", active: pathname === "/dashboard/stones" },
    { icon: ShoppingCart, label: "SALES & ANALYTICS", href: "/dashboard/sales", active: pathname === "/dashboard/sales" },
    { icon: Bell, label: "REMAINDERS", href: "/dashboard/remainders", active: pathname === "/dashboard/remainders" },
    { icon: BarChart3, label: "REPORTS", href: "/dashboard/reports", active: pathname === "/dashboard/reports" },
    { icon: Settings, label: "SALES", href: "/dashboard/settings", active: pathname === "/dashboard/settings" },
  ];

  return (
    <AuroraBackground>
             {/* Menu Button - Visible on all screen sizes */}
       <Button
         variant="outline"
         size="icon"
         onClick={toggleSidebar}
         className="fixed top-4 left-4 z-50 bg-white/10 border-white/20 text-white hover:bg-white/20"
       >
         <Menu className="h-5 w-5" />
       </Button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-transparent border-r border-white/20 transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <img src="/assets/logo.png" alt="logo" className="h-8 w-8" />
            <h2 className="text-xl font-bold text-white">Zain Gems</h2>
          </div>
                     <Button
             variant="ghost"
             size="icon"
             onClick={toggleSidebar}
             className="text-white hover:bg-white/20"
           >
             <X className="h-5 w-5" />
           </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href} onClick={() => setIsSidebarOpen(false)}>
              <Button
                variant={item.active ? "secondary" : "ghost"}
                className={`w-full justify-start text-left h-12 ${
                  item.active 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/20">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-gray-300 hover:bg-white/10 hover:text-white h-12"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {children}
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </AuroraBackground>
  );
}
