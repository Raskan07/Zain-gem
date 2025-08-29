"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Gem, 
  ShoppingCart, 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { SalesExpensesChart, ProfitTrendChart, InventoryDistributionChart } from "@/components/dashboard-charts";

// Type definitions
interface Stone {
  id: string;
  type: string;
  weight: number;
  purchasePrice: number;
  cuttingCost: number;
  certificationCost: number;
  currentValue: number;
  status: "In Stock" | "Reserved" | "Sold" | "Certification Pending";
}

interface NewStone {
  type: string;
  weight: number;
  purchasePrice: number;
  cuttingCost: number;
  certificationCost: number;
  currentValue: number;
  status: "In Stock" | "Reserved" | "Sold" | "Certification Pending";
}

// Mock data - replace with actual Firestore data
const mockStones: Stone[] = [
  { id: "ST001", type: "Sapphire", weight: 2.5, purchasePrice: 1500, cuttingCost: 200, certificationCost: 150, currentValue: 2200, status: "In Stock" },
  { id: "ST002", type: "Ruby", weight: 1.8, purchasePrice: 1200, cuttingCost: 180, certificationCost: 120, currentValue: 1800, status: "Reserved" },
  { id: "ST003", type: "Emerald", weight: 3.2, purchasePrice: 2000, cuttingCost: 250, certificationCost: 180, currentValue: 2800, status: "Sold" },
  { id: "ST004", type: "Diamond", weight: 1.5, purchasePrice: 3000, cuttingCost: 300, certificationCost: 200, currentValue: 4200, status: "In Stock" },
  { id: "ST005", type: "Sapphire", weight: 2.1, purchasePrice: 1400, cuttingCost: 190, certificationCost: 140, currentValue: 2000, status: "Certification Pending" },
];

const mockRecentActivity = [
  { id: 1, action: "New Stone Added", description: "Sapphire #ST001 was added to collection", time: "2 hours ago", type: "add" },
  { id: 2, action: "Sale Completed", description: "Emerald #ST003 sold for $2,800", time: "4 hours ago", type: "sale" },
  { id: 3, action: "Stone Reserved", description: "Ruby #ST002 reserved for client", time: "1 day ago", type: "reserve" },
  { id: 4, action: "Certificate Expired", description: "Diamond #ST004 certificate needs renewal", time: "2 days ago", type: "alert" },
  { id: 5, action: "Low Stock Alert", description: "Sapphire inventory below threshold", time: "3 days ago", type: "alert" },
];

const mockAlerts = [
  { id: 1, type: "payment", message: "Pending buyer payment for Ruby #ST002", severity: "warning" },
  { id: 2, type: "certificate", message: "Diamond #ST004 certificate expires in 30 days", severity: "info" },
  { id: 3, type: "stock", message: "Sapphire stock below minimum threshold", severity: "error" },
];

export default function Dashboard() {
  const [stones, setStones] = useState<Stone[]>(mockStones);
  const [profitFilter, setProfitFilter] = useState("overall");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingStone, setEditingStone] = useState<Stone | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate summary data
  const totalStones = stones.length;
  const totalInvestment = stones.reduce((sum, stone) => sum + stone.purchasePrice + stone.cuttingCost + stone.certificationCost, 0);
  const totalSales = stones.filter(s => s.status === "Sold").reduce((sum, stone) => sum + stone.currentValue, 0);
  const totalProfit = totalSales - totalInvestment;

  const inStockCount = stones.filter(s => s.status === "In Stock").length;
  const reservedCount = stones.filter(s => s.status === "Reserved").length;
  const soldCount = stones.filter(s => s.status === "Sold").length;
  const pendingCount = stones.filter(s => s.status === "Certification Pending").length;

  const totalCaratWeight = stones.reduce((sum, stone) => sum + stone.weight, 0);
  const estimatedTotalValue = stones.reduce((sum, stone) => sum + stone.currentValue, 0);

  // Filter stones based on search and status
  const filteredStones = stones.filter(stone => {
    const matchesSearch = stone.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stone.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || stone.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddStone = (newStone: NewStone) => {
    setStones([...stones, { ...newStone, id: `ST${String(stones.length + 1).padStart(3, '0')}` }]);
    setShowAddForm(false);
  };

  const handleEditStone = (id: string, updatedData: Partial<Stone>) => {
    setStones(stones.map(stone => stone.id === id ? { ...stone, ...updatedData } : stone));
    setEditingStone(null);
  };

  const handleDeleteStone = (id: string) => {
    setStones(stones.filter(stone => stone.id !== id));
  };

  const getStatusBadge = (status: Stone['status']) => {
    const variants: Record<Stone['status'], string> = {
      "In Stock": "default",
      "Reserved": "secondary",
      "Sold": "destructive",
      "Certification Pending": "outline"
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-300">Comprehensive view of your gem collection and business metrics</p>
      </div>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <Gem className="h-5 w-5 mr-2" />
              Total Stones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalStones}</p>
            <p className="text-gray-300 text-sm">Current inventory</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="h-5 w-5 mr-2" />
              Total Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalInvestment.toLocaleString()}</p>
            <p className="text-gray-300 text-sm">Purchase + expenses</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${totalSales.toLocaleString()}</p>
            <p className="text-gray-300 text-sm">Revenue generated</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="h-5 w-5 mr-2" />
              Total Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-3xl font-bold">${totalProfit.toLocaleString()}</p>
              <Select value={profitFilter} onValueChange={setProfitFilter}>
                <SelectTrigger className="w-20 h-8 backdrop-blur-md bg-white/10 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-white/10 border-white/20">
                  <SelectItem value="weekly">W</SelectItem>
                  <SelectItem value="monthly">M</SelectItem>
                  <SelectItem value="overall">O</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-gray-300 text-sm">Net profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription className="text-gray-300">Collection summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
                <p className="text-2xl font-bold">{totalStones}</p>
                <p className="text-sm text-gray-300">Total Stock</p>
              </div>
              <div className="text-center p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
                <p className="text-2xl font-bold">{totalCaratWeight.toFixed(1)}</p>
                <p className="text-sm text-gray-300">Total Carats</p>
              </div>
            </div>
            <div className="text-center p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
              <p className="text-2xl font-bold">${estimatedTotalValue.toLocaleString()}</p>
              <p className="text-sm text-gray-300">Estimated Total Value</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 backdrop-blur-sm bg-white/5 rounded border border-white/10">
                <span className="text-sm">In Stock</span>
                <Badge variant="default">{inStockCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 backdrop-blur-sm bg-white/5 rounded border border-white/10">
                <span className="text-sm">Reserved</span>
                <Badge variant="secondary">{reservedCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 backdrop-blur-sm bg-white/5 rounded border border-white/10">
                <span className="text-sm">Sold</span>
                <Badge variant="destructive">{soldCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-2 backdrop-blur-sm bg-white/5 rounded border border-white/10">
                <span className="text-sm">Pending</span>
                <Badge variant="outline">{pendingCount}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
          <CardHeader>
            <CardTitle>Alerts & Reminders</CardTitle>
            <CardDescription className="text-gray-300">Important notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAlerts.map(alert => (
              <Alert key={alert.id} className="backdrop-blur-sm bg-white/5 border-white/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-white">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
        <CardHeader>
          <CardTitle>Analytics & Trends</CardTitle>
          <CardDescription className="text-gray-300">Business performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-64">
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Sales vs Expenses</h3>
              <SalesExpensesChart />
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Profit Trend</h3>
              <ProfitTrendChart />
            </div>
            <div className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Inventory Distribution</h3>
              <InventoryDistributionChart />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Data Table */}
      <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Stone Inventory</CardTitle>
              <CardDescription className="text-gray-300">Manage your gem collection</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Plus className="h-4 w-4 mr-1" />
                Add Stone
              </Button>
              <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search stones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 backdrop-blur-sm bg-white/5 border-white/20 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 backdrop-blur-sm bg-white/5 border-white/20 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-white/10 border-white/20">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Reserved">Reserved</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="Certification Pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="border border-white/20 rounded-lg overflow-hidden backdrop-blur-sm bg-white/5">
            <Table>
              <TableHeader>
                <TableRow className="backdrop-blur-sm bg-white/10">
                  <TableHead className="text-white">Stone ID</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Weight (ct)</TableHead>
                  <TableHead className="text-white">Purchase Price</TableHead>
                  <TableHead className="text-white">Cutting Cost</TableHead>
                  <TableHead className="text-white">Cert. Cost</TableHead>
                  <TableHead className="text-white">Current Value</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStones.map((stone) => (
                  <TableRow key={stone.id} className="border-white/10 hover:bg-white/5 transition-colors">
                    <TableCell className="text-white font-mono">{stone.id}</TableCell>
                    <TableCell className="text-white">{stone.type}</TableCell>
                    <TableCell className="text-white">{stone.weight}</TableCell>
                    <TableCell className="text-white">${stone.purchasePrice}</TableCell>
                    <TableCell className="text-white">${stone.cuttingCost}</TableCell>
                    <TableCell className="text-white">${stone.certificationCost}</TableCell>
                    <TableCell className="text-white">${stone.currentValue}</TableCell>
                    <TableCell>{getStatusBadge(stone.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingStone(stone)}
                          className="text-white hover:bg-white/10"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStone(stone.id)}
                          className="text-white hover:bg-white/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-xl hover:bg-white/15 transition-all duration-300">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription className="text-gray-300">Latest updates from your gem collection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full backdrop-blur-sm ${
                    activity.type === 'add' ? 'bg-green-500/20' :
                    activity.type === 'sale' ? 'bg-blue-500/20' :
                    activity.type === 'reserve' ? 'bg-yellow-500/20' :
                    'bg-red-500/20'
                  }`}>
                    {activity.type === 'add' && <Plus className="h-4 w-4" />}
                    {activity.type === 'sale' && <ShoppingCart className="h-4 w-4" />}
                    {activity.type === 'reserve' && <Clock className="h-4 w-4" />}
                    {activity.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-300">{activity.description}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Stone Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>Add New Stone</DialogTitle>
          </DialogHeader>
          <AddStoneForm onSubmit={handleAddStone} onCancel={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Stone Dialog */}
      <Dialog open={!!editingStone} onOpenChange={() => setEditingStone(null)}>
        <DialogContent className="backdrop-blur-md bg-white/10 border-white/20 text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle>Edit Stone</DialogTitle>
          </DialogHeader>
          {editingStone && (
            <EditStoneForm 
              stone={editingStone} 
              onSubmit={(updatedData) => handleEditStone(editingStone.id, updatedData)} 
              onCancel={() => setEditingStone(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Stone Form Component
function AddStoneForm({ onSubmit, onCancel }: { onSubmit: (stone: NewStone) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: "",
    weight: "",
    purchasePrice: "",
    cuttingCost: "",
    certificationCost: "",
    currentValue: "",
    status: "In Stock" as Stone['status']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      weight: parseFloat(formData.weight),
      purchasePrice: parseFloat(formData.purchasePrice),
      cuttingCost: parseFloat(formData.cuttingCost),
      certificationCost: parseFloat(formData.certificationCost),
      currentValue: parseFloat(formData.currentValue)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger className="backdrop-blur-sm bg-white/5 border-white/20 text-white">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-md bg-white/10 border-white/20">
              <SelectItem value="Sapphire">Sapphire</SelectItem>
              <SelectItem value="Ruby">Ruby</SelectItem>
              <SelectItem value="Emerald">Emerald</SelectItem>
              <SelectItem value="Diamond">Diamond</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="weight">Weight (carats)</Label>
                      <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              className="backdrop-blur-sm bg-white/5 border-white/20 text-white"
              required
            />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="purchasePrice">Purchase Price</Label>
          <Input
            id="purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
            className="backdrop-blur-sm bg-white/5 border-white/20 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="currentValue">Current Value</Label>
          <Input
            id="currentValue"
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
            className="backdrop-blur-sm bg-white/5 border-white/20 text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cuttingCost">Cutting Cost</Label>
          <Input
            id="cuttingCost"
            type="number"
            value={formData.cuttingCost}
            onChange={(e) => setFormData({...formData, cuttingCost: e.target.value})}
            className="backdrop-blur-sm bg-white/5 border-white/20 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="certificationCost">Certification Cost</Label>
          <Input
            id="certificationCost"
            type="number"
            value={formData.certificationCost}
            onChange={(e) => setFormData({...formData, certificationCost: e.target.value})}
            className="backdrop-blur-sm bg-white/5 border-white/20 text-white"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value: Stone['status']) => setFormData({...formData, status: value})}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Reserved">Reserved</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
            <SelectItem value="Certification Pending">Certification Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
          Cancel
        </Button>
        <Button type="submit" className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20">
          Add Stone
        </Button>
      </div>
    </form>
  );
}

// Edit Stone Form Component
function EditStoneForm({ stone, onSubmit, onCancel }: { stone: Stone; onSubmit: (updatedData: Partial<Stone>) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: stone.type,
    weight: stone.weight.toString(),
    purchasePrice: stone.purchasePrice.toString(),
    cuttingCost: stone.cuttingCost.toString(),
    certificationCost: stone.certificationCost.toString(),
    currentValue: stone.currentValue.toString(),
    status: stone.status
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      weight: parseFloat(formData.weight),
      purchasePrice: parseFloat(formData.purchasePrice),
      cuttingCost: parseFloat(formData.cuttingCost),
      certificationCost: parseFloat(formData.certificationCost),
      currentValue: parseFloat(formData.currentValue)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger className="bg-white/5 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Sapphire">Sapphire</SelectItem>
              <SelectItem value="Ruby">Ruby</SelectItem>
              <SelectItem value="Emerald">Emerald</SelectItem>
              <SelectItem value="Diamond">Diamond</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="edit-weight">Weight (carats)</Label>
          <Input
            id="edit-weight"
            type="number"
            step="0.1"
            value={formData.weight}
            onChange={(e) => setFormData({...formData, weight: e.target.value})}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
          <Input
            id="edit-purchasePrice"
            type="number"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({...formData, purchasePrice: e.target.value})}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-currentValue">Current Value</Label>
          <Input
            id="edit-currentValue"
            type="number"
            value={formData.currentValue}
            onChange={(e) => setFormData({...formData, currentValue: e.target.value})}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-cuttingCost">Cutting Cost</Label>
          <Input
            id="edit-cuttingCost"
            type="number"
            value={formData.cuttingCost}
            onChange={(e) => setFormData({...formData, cuttingCost: e.target.value})}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
        <div>
          <Label htmlFor="edit-certificationCost">Certification Cost</Label>
          <Input
            id="edit-certificationCost"
            type="number"
            value={formData.certificationCost}
            onChange={(e) => setFormData({...formData, certificationCost: e.target.value})}
            className="bg-white/5 border-white/20 text-white"
            required
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-status">Status</Label>
        <Select value={formData.status} onValueChange={(value: Stone['status']) => setFormData({...formData, status: value})}>
          <SelectTrigger className="bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Reserved">Reserved</SelectItem>
            <SelectItem value="Sold">Sold</SelectItem>
            <SelectItem value="Certification Pending">Certification Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Update Stone
        </Button>
      </div>
    </form>
  );
}
