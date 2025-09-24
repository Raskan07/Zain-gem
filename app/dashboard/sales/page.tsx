'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, DollarSign, ShoppingCart, Users, CreditCard, Clock, CheckCircle, PieChart, BarChart2 } from "lucide-react";
import SummaryCard from '@/components/sub-componets/SummaryCard';
import MonthlySalesChart from '@/components/charts/MonthlySalesChart';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

export default function SalesPage() {
 

  // Profit aggregation state
  const [profitMyStone, setProfitMyStone] = useState<number | null>(null);
  const [profitBorrowed, setProfitBorrowed] = useState<number | null>(null);

  // Other aggregates
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [archivesSales, setArchivesSales] = useState<number>(0);
  const [remSalesState, setRemSalesState] = useState<number>(0);
  const [currentMonthSales, setCurrentMonthSales] = useState<number>(0);
  const [remCurrentMonthSales, setRemCurrentMonthSales] = useState<number>(0);
  const [arcCurrentMonthSales, setArcCurrentMonthSales] = useState<number>(0);
  const [pendingPayments, setPendingPayments] = useState<number>(0);
  const [receivedPayments, setReceivedPayments] = useState<number>(0);
  const [thisMonthProfits, setThisMonthProfits] = useState<number>(0);
  const [remThisMonthProfits, setRemThisMonthProfits] = useState<number>(0);
  const [arcThisMonthProfits, setArcThisMonthProfits] = useState<number>(0);
  const [remProfitMy, setRemProfitMy] = useState<number>(0);
  const [remProfitBorrowed, setRemProfitBorrowed] = useState<number>(0);
  const [arcProfitMy, setArcProfitMy] = useState<number>(0);
  const [arcProfitBorrowed, setArcProfitBorrowed] = useState<number>(0);

  // human-readable current month name for UI
  const monthNames = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];
  const nowForMonthName = new Date();
  const currentMonthName = monthNames[nowForMonthName.getMonth()];

  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Stones -> Total Investment
    const stonesUnsub = onSnapshot(query(collection(db, 'stones')), (snap) => {
      let totalInv = 0;
      snap.docs.forEach(d => {
        const data: any = d.data();
        // prefer totalCost if available, else compute
        const tc = Number(data.totalCost) || 0;
        if (tc > 0) totalInv += tc;
        else {
          const computed = (Number(data.stoneCost) || 0) + (Number(data.cuttingCost) || 0) + (Number(data.polishCost) || 0) + (Number(data.treatmentCost) || 0) + (Number(data.otherCost) || 0);
          totalInv += computed;
        }
      });
      setTotalInvestment(totalInv);
    }, (err) => console.error('Error listening stones:', err));

    // Remainders -> sales, pending, profits
    const remUnsub = onSnapshot(query(collection(db, 'remainders')), (snap) => {
  let myProfit = 0;
  let borrowedProfit = 0;
  let remSales = 0; // total sellingPrice from remainders
  let salesPaid = 0;
  let pending = 0;
  let currentMonth = 0;
  let monthProfits = 0;

      snap.docs.forEach(d => {
        const data: any = d.data();
        const sellingPrice = Number(data.sellingPrice) || 0;
        const myP = Number(data.myProfit) || 0;
        const status = data.status || '';

  // accumulate total sales from remainders regardless of status
  remSales += sellingPrice;

  // status paid contributes to salesPaid (optional)
  if (status === 'paid') salesPaid += sellingPrice;

  // pending payments
  if (status === 'pending') pending += sellingPrice;

        // profit accumulation
        if (data.stoneOwner === 'me') myProfit += myP;
        else borrowedProfit += myP;

        // current month check using sellingDate or createdAt
        let sDate: Date | null = null;
        if (data.sellingDate) {
          if (data.sellingDate.toDate) sDate = data.sellingDate.toDate();
          else sDate = new Date(data.sellingDate);
        } else if (data.createdAt) {
          if (data.createdAt.toDate) sDate = data.createdAt.toDate();
          else sDate = new Date(data.createdAt);
        }

        if (sDate && sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear) {
          currentMonth += sellingPrice;
          monthProfits += myP;
        }
      });

  setRemProfitMy(myProfit);
  setRemProfitBorrowed(borrowedProfit);
  // remainders-only pending
  setPendingPayments(pending);
  // Total sales starts with all remainders' sellingPrice; archives will be added by archive listener
  setRemSalesState(remSales);
  setRemCurrentMonthSales(currentMonth);
  setRemThisMonthProfits(monthProfits);
    }, (err) => console.error('Error listening remainders:', err));

    // Archives -> add their sellingPrice and profits (received payments)
    const arcUnsub = onSnapshot(query(collection(db, 'archives')), (snap) => {
      let archSales = 0;
      let archMy = 0;
      let archBorrowed = 0;
      let received = 0;
      let monthProfitsAdd = 0;
      let currentMonthSalesAdd = 0;

      snap.docs.forEach(d => {
        const data: any = d.data();
        const sellingPrice = Number(data.sellingPrice) || 0;
        const myP = Number(data.myProfit) || 0;
        archSales += sellingPrice;
        if (data.stoneOwner === 'me') archMy += myP;
        else archBorrowed += myP;

        // received payments are archived
        received += sellingPrice;

        let aDate: Date | null = null;
        if (data.archivedAt) {
          if (data.archivedAt.toDate) aDate = data.archivedAt.toDate();
          else aDate = new Date(data.archivedAt);
        } else if (data.updatedAt) {
          if (data.updatedAt.toDate) aDate = data.updatedAt.toDate();
          else aDate = new Date(data.updatedAt);
        }

          if (aDate && aDate.getMonth() === currentMonth && aDate.getFullYear() === currentYear) {
            currentMonthSalesAdd += sellingPrice;
            monthProfitsAdd += myP;
          }
      });

      // Update totals by combining with remainders-derived values
      // replace archive-derived totals (do not accumulate across snapshot calls)
      setArchivesSales(archSales);
      setReceivedPayments(received);


      // set archive-derived profit parts into dedicated states
      setArcProfitMy(archMy);
      setArcProfitBorrowed(archBorrowed);

      // set archive-month contributions into dedicated states so we can safely combine later
      setArcCurrentMonthSales(currentMonthSalesAdd);
      setArcThisMonthProfits(monthProfitsAdd);
    }, (err) => console.error('Error listening archives:', err));

    return () => {
      try { stonesUnsub(); } catch {};
      try { remUnsub(); } catch {};
      try { arcUnsub(); } catch {};
    };
  }, []);

  // Recompute combined total sales when either source updates
  useEffect(() => {
    setTotalSales((Number(remSalesState) || 0) + (Number(archivesSales) || 0));
  }, [remSalesState, archivesSales]);

  // Combine current-month sales and month profits from remainders + archives
  useEffect(() => {
    setCurrentMonthSales((Number(remCurrentMonthSales) || 0) + (Number(arcCurrentMonthSales) || 0));
  }, [remCurrentMonthSales, arcCurrentMonthSales]);

  useEffect(() => {
    setThisMonthProfits((Number(remThisMonthProfits) || 0) + (Number(arcThisMonthProfits) || 0));
  }, [remThisMonthProfits, arcThisMonthProfits]);

  // Combine profit totals from rem and arc parts
  useEffect(() => {
    setProfitMyStone((Number(remProfitMy) || 0) + (Number(arcProfitMy) || 0));
    setProfitBorrowed((Number(remProfitBorrowed) || 0) + (Number(arcProfitBorrowed) || 0));
  }, [remProfitMy, remProfitBorrowed, arcProfitMy, arcProfitBorrowed]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
        <SummaryCard
          icon={<CreditCard className="h-8 w-8 text-indigo-400" />}
          value={<><span className="text-sm font-medium">LKR</span> {totalInvestment.toLocaleString()}</>}
          title="Total Investment"
        />

        <SummaryCard
          icon={<DollarSign className="h-8 w-8 text-green-400" />}
          value={<><span className="text-sm font-medium">LKR</span> {totalSales.toLocaleString()}</>}
          title="Total Sales"
        />

       
        <SummaryCard
          icon={<Clock className="h-8 w-8 text-orange-400" />}
          value={<><span className="text-sm font-medium">LKR</span> {pendingPayments.toLocaleString()}</>}
          title="Pending Payments"
        />

        <SummaryCard
          icon={<CheckCircle className="h-8 w-8 text-green-400" />}
          value={<><span className="text-sm font-medium">LKR</span> {receivedPayments.toLocaleString()}</>}
          title="Received Payments"
        />

        <SummaryCard
          icon={<PieChart className="h-8 w-8 text-pink-400" />}
          value={<>
            <span className="text-sm font-medium">LKR</span>{' '}
            {(() => {
              // Compute total profit: my stone profit minus borrowed? show net
              const my = profitMyStone ?? 0;
              const bor = profitBorrowed ?? 0;
              const net = my + bor; // both positive numbers from myProfit fields
              return net.toLocaleString();
            })()}
          </>}
          title="Total Profit / Loss"
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
            <MonthlySalesChart data={[]} />
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      
    </div>
  );
}




