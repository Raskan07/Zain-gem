import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";

export default function SalesPage() {
  const sales = [
    { id: 1, customer: "John Smith", items: "Sapphire Ring", amount: "$1,200", date: "2024-01-15", status: "Completed" },
    { id: 2, customer: "Sarah Johnson", items: "Emerald Necklace", amount: "$2,500", date: "2024-01-14", status: "Completed" },
    { id: 3, customer: "Mike Wilson", items: "Ruby Earrings", amount: "$950", date: "2024-01-13", status: "Pending" },
    { id: 4, customer: "Lisa Brown", items: "Diamond Bracelet", amount: "$3,800", date: "2024-01-12", status: "Completed" },
    { id: 5, customer: "David Lee", items: "Amethyst Pendant", amount: "$450", date: "2024-01-11", status: "Completed" },
    { id: 6, customer: "Emma Davis", items: "Topaz Ring", amount: "$380", date: "2024-01-10", status: "Cancelled" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Sales Management</h1>
          <p className="text-gray-300">Track your sales and customer transactions</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          New Sale
        </Button>
      </div>

      {/* Sales Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">$8,280</p>
                <p className="text-sm text-gray-300">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-300">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-gray-300">Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">+15%</p>
                <p className="text-sm text-gray-300">Growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales Chart Placeholder */}
      <Card className="bg-white/10 border-white/20 text-white mb-6">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription className="text-gray-300">
            Sales performance over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-white/5 rounded-lg">
            <div className="text-center text-gray-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-2" />
              <p>Sales Chart Visualization</p>
              <p className="text-sm">Chart component will be added here</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription className="text-gray-300">
            Latest customer transactions and orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Items</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-3 px-4 font-mono">#{sale.id.toString().padStart(4, '0')}</td>
                    <td className="py-3 px-4">{sale.customer}</td>
                    <td className="py-3 px-4">{sale.items}</td>
                    <td className="py-3 px-4 font-medium">{sale.amount}</td>
                    <td className="py-3 px-4">{sale.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        sale.status === 'Completed' 
                          ? 'bg-green-500/20 text-green-300'
                          : sale.status === 'Pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
