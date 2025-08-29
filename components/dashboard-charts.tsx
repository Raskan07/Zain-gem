"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock data for charts
const salesExpensesData = [
  { month: "Jan", sales: 4500, expenses: 3200 },
  { month: "Feb", sales: 5200, expenses: 3800 },
  { month: "Mar", sales: 4800, expenses: 3500 },
  { month: "Apr", sales: 6100, expenses: 4200 },
  { month: "May", sales: 5500, expenses: 3900 },
  { month: "Jun", sales: 6800, expenses: 4500 },
];

const profitTrendData = [
  { week: "W1", profit: 1200 },
  { week: "W2", profit: 1800 },
  { week: "W3", profit: 1400 },
  { week: "W4", profit: 2200 },
  { week: "W5", profit: 1900 },
  { week: "W6", profit: 2600 },
];

const inventoryDistributionData = [
  { name: "Sapphire", value: 35, color: "#3B82F6" },
  { name: "Ruby", value: 25, color: "#EF4444" },
  { name: "Emerald", value: 20, color: "#10B981" },
  { name: "Diamond", value: 20, color: "#F59E0B" },
];

export function SalesExpensesChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={salesExpensesData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="month" 
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "white"
          }}
          formatter={(value, name) => [`$${value}`, name]}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="sales" 
          stroke="#10B981" 
          strokeWidth={2}
          name="Sales"
        />
        <Line 
          type="monotone" 
          dataKey="expenses" 
          stroke="#EF4444" 
          strokeWidth={2}
          name="Expenses"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ProfitTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={profitTrendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="week" 
          stroke="#9CA3AF"
          fontSize={12}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "white"
          }}
          formatter={(value) => [`$${value}`, "Profit"]}
        />
        <Bar 
          dataKey="profit" 
          fill="#3B82F6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InventoryDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={inventoryDistributionData}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {inventoryDistributionData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "white"
          }}
          formatter={(value, name) => [`${value}%`, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
