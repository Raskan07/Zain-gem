import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, DollarSign, ShoppingCart, Users, CreditCard, Clock, CheckCircle, PieChart, BarChart2 } from "lucide-react";
import SummaryCard from '@/components/sub-componets/SummaryCard';
import MonthlySalesChart from '@/components/charts/MonthlySalesChart';

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

      {/* Sales Summary Cards (first-pass UI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
        <SummaryCard
          icon={<CreditCard className="h-8 w-8 text-indigo-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 120,000</>}
          title="Total Investment"
        />

        <SummaryCard
          icon={<DollarSign className="h-8 w-8 text-green-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 98,500</>}
          title="Total Sales"
        />

        <SummaryCard
          icon={<TrendingUp className="h-8 w-8 text-yellow-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 12,400</>}
          title="Current Month Sales"
        />
  
        <SummaryCard
          icon={<Clock className="h-8 w-8 text-orange-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 5,200</>}
          title="Pending Payments"
        />

        <SummaryCard
          icon={<CheckCircle className="h-8 w-8 text-green-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 93,300</>}
          title="Received Payments"
        />

        <SummaryCard
          icon={<PieChart className="h-8 w-8 text-pink-400" />}
          value={<><span className="text-sm font-medium">LKR</span> -21,500</>}
          title="Total Profit / Loss"
        />

        <SummaryCard
          icon={<BarChart2 className="h-8 w-8 text-cyan-400" />}
          value={<><span className="text-sm font-medium">LKR</span> 3,200</>}
          title="This Month Profits"
        />
      </div>

      {/* Recent Sales Chart Placeholder */}
      <Card className="bg-white/10 border-white/20 text-white mb-6">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription className="text-gray-300">
            Sales by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-white/5 rounded-lg p-2">
            {/* Monthly sales chart using ChartContainer */}
            <MonthlySalesChart data={[
              { month: 'Jan', sales: 8200 },
              { month: 'Feb', sales: 9400 },
              { month: 'Mar', sales: 7600 },
              { month: 'Apr', sales: 10400 },
              { month: 'May', sales: 9800 },
              { month: 'Jun', sales: 11200 },
              { month: 'Jul', sales: 12500 },
              { month: 'Aug', sales: 9400 },
              { month: 'Sep', sales: 10800 },
              { month: 'Oct', sales: 9800 },
              { month: 'Nov', sales: 11600 },
              { month: 'Dec', sales: 13800 },
            ]} />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      
    </div>
  );
}
