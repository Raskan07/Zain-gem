"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gem, ShoppingCart, BarChart3 } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-300">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gem className="h-5 w-5 mr-2" />
              Total Stones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">1,247</p>
            <p className="text-gray-300 text-sm">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">892</p>
            <p className="text-gray-300 text-sm">+8% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$45,678</p>
            <p className="text-gray-300 text-sm">+23% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="text-gray-300">
            Latest updates from your gem collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">New Stone Added</p>
                <p className="text-sm text-gray-300">Sapphire #247 was added to collection</p>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">Sale Completed</p>
                <p className="text-sm text-gray-300">Emerald ring sold for $2,500</p>
              </div>
              <span className="text-sm text-gray-400">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">Remainder Set</p>
                <p className="text-sm text-gray-300">Low stock alert for Ruby collection</p>
              </div>
              <span className="text-sm text-gray-400">1 day ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
