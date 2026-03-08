  "use client";

  import { useState, useEffect } from "react";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
  import { Badge } from "@/components/ui/badge";
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
  import { Alert, AlertDescription } from "@/components/ui/alert";
  import { 
    Plus, 
    Search, 
    Filter, 
    Gem, 
    Edit, 
    Trash2, 
    Download,
    TrendingUp,
    TrendingDown,
    Package,
    ShoppingCart,
    Clock,
    AlertTriangle,
    Upload,  
    X,
    Eye
  } from "lucide-react";
  import { 
    db, 
    stonesCollection, 
    stoneTypes, 
    statusOptions, 
    treatmentOptions 
  } from "@/lib/firebase";
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
  import { 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    onSnapshot, 
    query, 
    orderBy,
    getDocs,
    limit
  } from "firebase/firestore";
  import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
  } from "firebase/storage";
  import { storage } from "@/lib/firebase";
import { logActivity } from "@/lib/logger";

  // Type definitions
  interface Stone {
    id: string;
    name: string;
    weightInRough: number;
    weight: number;
    stoneCost: number;
    cuttingCost: number;
    polishCost: number;
    treatmentCost: number;
    otherCost: number;
    totalCost: number;
    status: "In Stock" | "Sold" | "Pending";
    priceToSell: number;
    soldPrice: number;
    treatment: "Natural" | "Heat" | "Electric";
    profitLoss: number | null;
    images?: string[];
    createdAt: Date;
    updatedAt: Date;
    customId?: string; // zero-padded display id, e.g. "001"
    customIdNum?: number; // numeric id for ordering
  }

  interface NewStone {
    name: string;
    weightInRough: number;
    weight: number;
    stoneCost: number;
    cuttingCost: number;
    polishCost: number;
    treatmentCost: number;
    otherCost: number;
    status: "In Stock" | "Sold" | "Pending";
    priceToSell: number;
    soldPrice: number;
    treatment: "Natural" | "Heat" | "Electric";
    images?: string[];
  }

  export default function StonesPage() {
    const [stones, setStones] = useState<Stone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingStone, setEditingStone] = useState<Stone | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [nameFilter, setNameFilter] = useState("all");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);

    // Calculate summary data
    const totalStones = stones.length;
    const inStockStones = stones.filter(s => s.status === "In Stock").length;
    const soldStones = stones.filter(s => s.status === "Sold").length;
    const pendingStones = stones.filter(s => s.status === "Pending").length;

    // Filter stones based on search and filters
    const filteredStones = stones.filter(stone => {
      const matchesSearch = stone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          stone.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || stone.status === statusFilter;
      const matchesName = nameFilter === "all" || stone.name === nameFilter;
      return matchesSearch && matchesStatus && matchesName;
    });

    // Export helpers
    const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();
    const isSameWeek = (d1: Date, d2: Date) => {
      const ref = new Date(d2);
      // set ref to Monday 00:00
      const day = ref.getDay();
      const diffToMonday = (day === 0 ? -6 : 1) - day;
      ref.setHours(0,0,0,0);
      ref.setDate(ref.getDate() + diffToMonday);
      const weekStart = new Date(ref);
      const weekEnd = new Date(ref);
      weekEnd.setDate(weekStart.getDate() + 7);
      return d1 >= weekStart && d1 < weekEnd;
    };
    const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

    const getRange = (range: "all" | "day" | "week" | "month") => {
      const now = new Date();
      if (range === "day") return stones.filter(s => isSameDay(s.createdAt, now));
      if (range === "week") return stones.filter(s => isSameWeek(s.createdAt, now));
      if (range === "month") return stones.filter(s => isSameMonth(s.createdAt, now));
      return stones;
    };

    const openPrintWindow = (rows: Stone[], title: string) => {
      const html = `<!doctype html>
        <html>
        <head>
          <meta charset='utf-8'/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>
          <title>${title}</title>
          <style>
            body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:24px;}
            h1{font-size:20px; margin:0 0 12px;}
            table{border-collapse:collapse; width:100%; font-size:12px}
            th,td{border:1px solid #ccc; padding:8px; text-align:left}
            th{background:#f6f6f6}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Status</th>
                <th>Weight (Rough)</th>
                <th>Weight</th>
                <th>Stone Cost</th>
                <th>Cutting</th>
                <th>Polish</th>
                <th>Treatment</th>
                <th>Other</th>
                <th>Total Cost</th>
                <th>Price To Sell</th>
                <th>Sold Price</th>
                <th>Treatment Type</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.name}</td>
                  <td>${s.status}</td>
                  <td>${s.weightInRough}</td>
                  <td>${s.weight}</td>
                  <td>${s.stoneCost}</td>
                  <td>${s.cuttingCost}</td>
                  <td>${s.polishCost}</td>
                  <td>${s.treatmentCost}</td>
                  <td>${s.otherCost}</td>
                  <td>${s.totalCost}</td>
                  <td>${s.priceToSell}</td>
                  <td>${s.soldPrice || '-'}</td>
                  <td>${s.treatment}</td>
                  <td>${s.createdAt.toLocaleDateString('en-US')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>`;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    };

    // Open a printable report view for a single stone (includes images)
    const openStoneReport = (stone: Stone) => {
      const title = `Stone Report - ${stone.customId ?? stone.id} - ${stone.name}`;
      const imagesHtml = (stone.images || []).map(img => `
          <div style="margin:8px">
            <img src="${img}" style="max-width:300px; max-height:300px; object-fit:contain; border-radius:8px;" />
          </div>
        `).join('');

      const html = `<!doctype html>
        <html>
        <head>
          <meta charset='utf-8'/>
          <meta name='viewport' content='width=device-width, initial-scale=1'/>
          <title>${title}</title>
          <style>
            body{font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding:24px; color:#111}
            h1{font-size:22px; margin:0 0 12px}
            .meta{margin-bottom:12px}
            .grid{display:flex;gap:16px;flex-wrap:wrap}
            .col{flex:1;min-width:220px}
            table{border-collapse:collapse;width:100%;font-size:14px}
            th,td{border:1px solid #ddd;padding:8px;text-align:left}
            th{background:#f6f6f6}
            .images{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <strong>Stone:</strong> ${stone.name} <br />
            <strong>ID:</strong> ${stone.customId ?? stone.id} <br />
            <strong>Status:</strong> ${stone.status} <br />
            <strong>Created:</strong> ${stone.createdAt.toLocaleDateString()}
          </div>

          <div class="grid">
            <div class="col">
              <table>
                <tr><th>Field</th><th>Value</th></tr>
                <tr><td>Weight (Rough)</td><td>${stone.weightInRough} ct</td></tr>
                <tr><td>Weight</td><td>${stone.weight} ct</td></tr>
                <tr><td>Stone Cost</td><td>LKR ${stone.stoneCost.toLocaleString()}</td></tr>
                <tr><td>Cutting Cost</td><td>LKR ${stone.cuttingCost.toLocaleString()}</td></tr>
                <tr><td>Polish Cost</td><td>LKR ${stone.polishCost.toLocaleString()}</td></tr>
                <tr><td>Treatment Cost</td><td>LKR ${stone.treatmentCost.toLocaleString()}</td></tr>
                <tr><td>Other Cost</td><td>LKR ${stone.otherCost.toLocaleString()}</td></tr>
                <tr><td>Total Cost</td><td>LKR ${stone.totalCost.toLocaleString()}</td></tr>
                <tr><td>Price to Sell</td><td>LKR ${stone.priceToSell.toLocaleString()}</td></tr>
                <tr><td>Sold Price</td><td>${stone.soldPrice > 0 ? 'LKR ' + stone.soldPrice.toLocaleString() : '-'}</td></tr>
                <tr><td>Treatment</td><td>${stone.treatment}</td></tr>
                <tr><td>Profit/Loss</td><td>${stone.profitLoss !== null ? (stone.profitLoss >=0 ? '+' : '') + 'LKR ' + stone.profitLoss.toLocaleString() : '-'}</td></tr>
              </table>
            </div>
            <div class="col">
              <div><strong>Images</strong></div>
              <div class="images">
                ${imagesHtml || '<div style="color:#666">No images available</div>'}
              </div>
            </div>
          </div>

          <div style="margin-top:20px; text-align:right">
            <button onclick="window.print()" style="padding:8px 12px;border-radius:6px;background:#2563eb;color:white;border:none;cursor:pointer">Print / Save as PDF</button>
          </div>
        </body>
        </html>`;

      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    };

    const handleExport = (range: "all" | "day" | "week" | "month") => {
      const rows = getRange(range);
      const titleMap = { all: 'All Stones', day: 'Today', week: 'This Week', month: 'This Month' } as const;
      openPrintWindow(rows, `Stones Report - ${titleMap[range]}`);
    };

    // Real-time Firebase listener
    useEffect(() => {
      // Safety timeout: stop loading after 5 seconds regardless of Firebase
      const timeout = setTimeout(() => {
        if (loading) setLoading(false);
      }, 5000);

      const q = query(stonesCollection); // Removed orderBy to avoid index issues
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const stonesData: Stone[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const totalCost = (Number(data.stoneCost) || 0) + (Number(data.cuttingCost) || 0) + (Number(data.polishCost) || 0) + (Number(data.treatmentCost) || 0) + (Number(data.otherCost) || 0);
          
          let createdAtDate = new Date();
          try {
            if (data.createdAt?.toDate) createdAtDate = data.createdAt.toDate();
            else if (data.createdAt instanceof Date) createdAtDate = data.createdAt;
          } catch (e) {
            console.warn("Date parsing error:", e);
          }

          let updatedAtDate = createdAtDate;
          try {
            if (data.updatedAt?.toDate) updatedAtDate = data.updatedAt.toDate();
            else if (data.updatedAt instanceof Date) updatedAtDate = data.updatedAt;
          } catch (e) {
            console.warn("Date parsing error (updatedAt):", e);
          }

          stonesData.push({
            id: doc.id,
            name: data.name || "Unknown Stone",
            weightInRough: Number(data.weightInRough) || 0,
            weight: Number(data.weight) || 0,
            stoneCost: Number(data.stoneCost) || 0,
            cuttingCost: Number(data.cuttingCost) || 0,
            polishCost: Number(data.polishCost) || 0,
            treatmentCost: Number(data.treatmentCost) || 0,
            otherCost: Number(data.otherCost) || 0,
            totalCost: totalCost,
            status: data.status || "In Stock",
            priceToSell: Number(data.priceToSell) || 0,
            soldPrice: Number(data.soldPrice) || 0,
            treatment: data.treatment || "Natural",
            profitLoss: typeof data.profitLoss === 'number' ? data.profitLoss : null,
            images: data.images || [],
            createdAt: createdAtDate,
            updatedAt: updatedAtDate,
            customId: data.customId || undefined,
            customIdNum: data.customIdNum || undefined,
          });
        });
        setStones(stonesData);
        setLoading(false);
      }, (error) => {
        console.error("Firebase Snapshot Error:", error);
        setLoading(false);
      });

      return () => {
        unsubscribe();
        clearTimeout(timeout);
      };
    }, []);

    const handleAddStone = async (newStone: NewStone) => {
      try {
        // Calculate total cost
        const totalCost = newStone.stoneCost + newStone.cuttingCost + newStone.polishCost + newStone.treatmentCost + newStone.otherCost;
        
        // Calculate profit/loss
        const profitLoss = newStone.soldPrice > 0 ? newStone.soldPrice - totalCost : null;
        // Determine next customIdNum by fetching the highest existing one
        let nextNum = 1;
        try {
          const q2 = query(stonesCollection, orderBy('customIdNum', 'desc'), limit(1));
          const snap = await getDocs(q2);
          if (!snap.empty) {
            const top = snap.docs[0].data();
            const topNum = top.customIdNum || top.customId ? Number(top.customId) : undefined;
            if (typeof topNum === 'number' && !isNaN(topNum)) {
              nextNum = topNum + 1;
            }
          }
        } catch (err) {
          // if anything goes wrong, fallback to 1
          console.error('Error fetching last customIdNum:', err);
        }

        const customIdStr = String(nextNum).padStart(3, '0');

        await addDoc(stonesCollection, {
          ...newStone,
          totalCost,
          profitLoss,
          createdAt: new Date(),
          updatedAt: new Date(),
          customId: customIdStr,
          customIdNum: nextNum,
        });

        await logActivity(`Added new stone: ${newStone.name} (${customIdStr})`);
        setShowAddDialog(false);
      } catch (error) {
        console.error("Error adding stone:", error);
      }
    };

    const handleEditStone = async (id: string, updatedData: Partial<Stone>) => {
      try {
        const stone = stones.find(s => s.id === id);
        if (!stone) return;

        // Calculate total cost if any cost fields are updated
        let totalCost = stone.totalCost;
        if (updatedData.stoneCost !== undefined || updatedData.cuttingCost !== undefined || 
            updatedData.polishCost !== undefined || updatedData.treatmentCost !== undefined || 
            updatedData.otherCost !== undefined) {
          totalCost = (updatedData.stoneCost ?? stone.stoneCost) + 
                    (updatedData.cuttingCost ?? stone.cuttingCost) + 
                    (updatedData.polishCost ?? stone.polishCost) + 
                    (updatedData.treatmentCost ?? stone.treatmentCost) + 
                    (updatedData.otherCost ?? stone.otherCost);
        }

        // Calculate profit/loss if sold price or total cost is updated
        let profitLoss = updatedData.profitLoss;
        if (updatedData.soldPrice !== undefined || totalCost !== stone.totalCost) {
          const soldPrice = updatedData.soldPrice ?? stone.soldPrice;
          if (soldPrice > 0) {
            profitLoss = soldPrice - totalCost;
          } else {
            profitLoss = null;
          }
        }

        await updateDoc(doc(db, "stones", id), {
          ...updatedData,
          totalCost,
          profitLoss,
          updatedAt: new Date(),
        });

        await logActivity(`Updated stone: ${stone.name} (${stone.customId ?? id})`);
        setEditingStone(null);
      } catch (error) {
        console.error("Error updating stone:", error);
      }
    };

    const handleDeleteStone = async (id: string) => {
      if (confirm("Are you sure you want to delete this stone?")) {
        try {
          const stone = stones.find(s => s.id === id);
          
          // Delete associated images from Firebase Storage
          if (stone?.images && stone.images.length > 0) {
            const deletePromises = stone.images.map(async (imageUrl) => {
              if (imageUrl.includes('firebasestorage.googleapis.com')) {
                try {
                  const imageRef = ref(storage, imageUrl);
                  await deleteObject(imageRef);
                } catch (error) {
                  console.error('Error deleting image from storage:', error);
                }
              }
            });
            await Promise.all(deletePromises);
          }
          
          await deleteDoc(doc(db, "stones", id));
          await logActivity(`Deleted stone: ${stone?.name} (${stone?.customId ?? id})`);
        } catch (error) {
          console.error("Error deleting stone:", error);
        }
      }
    };

    const getStatusBadge = (status: Stone['status']) => {
      const variants: Record<Stone['status'], "default" | "secondary" | "destructive"> = {
        "In Stock": "default",
        "Sold": "destructive",
        "Pending": "secondary"
      };
      return <Badge variant={variants[status]}>{status}</Badge>;
    };

    const getProfitLossDisplay = (profitLoss: number | null) => {
      if (profitLoss === null) {
        return <span className="text-gray-400">---</span>;
      }
      const isProfit = profitLoss >= 0;
      return (
        <span className={`font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}LKR {profitLoss.toLocaleString()}
        </span>
      );
    };

    const handleImageUpload = async (files: FileList | null): Promise<string[]> => {
      if (!files) return [];

      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `stones/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });

      return Promise.all(uploadPromises);
    };

    const openImageModal = (imageUrl: string) => {
      setSelectedImage(imageUrl);
      setShowImageModal(true);
    };

    // Listen for image modal events from forms
    useEffect(() => {
      const handleImageModalEvent = (event: CustomEvent) => {
        openImageModal(event.detail);
      };

      window.addEventListener('openImageModal', handleImageModalEvent as EventListener);
      return () => {
        window.removeEventListener('openImageModal', handleImageModalEvent as EventListener);
      };
    }, []);

    if (loading) {
      return (
        <div className="w-full max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">Loading stones...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent tracking-tight mb-2">Stones Management</h1>
            <p className="text-white/60 text-lg font-medium">Manage your gem and stone inventory with Excel-like functionality</p>
          </div>
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="backdrop-blur-3xl bg-white/10 border-white/10 border text-white hover:bg-white/20 px-6 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 font-bold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Stone
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative rounded-3xl p-2 md:p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 md:p-6 relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Total Stones</p>
                <p className="text-4xl md:text-5xl font-black text-blue-400 tracking-tighter">{totalStones}</p>
              </div>
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] md:group-hover:scale-110 transition-transform duration-500">
                <Gem className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative rounded-3xl p-2 md:p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 md:p-6 relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">In Stock</p>
                <p className="text-4xl md:text-5xl font-black text-green-400 tracking-tighter">{inStockStones}</p>
              </div>
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)] md:group-hover:scale-110 transition-transform duration-500">
                <Package className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative rounded-3xl p-2 md:p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 md:p-6 relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Sold</p>
                <p className="text-4xl md:text-5xl font-black text-red-400 tracking-tighter">{soldStones}</p>
              </div>
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] md:group-hover:scale-110 transition-transform duration-500">
                <ShoppingCart className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </CardContent>
          </Card>

          <Card className="group backdrop-blur-3xl bg-white/5 border-white/5 hover:bg-white/10 transition-all duration-500 overflow-hidden relative rounded-3xl p-2 md:p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-4 md:p-6 relative z-10 flex items-center justify-between">
              <div>
                <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] mb-2">Pending</p>
                <p className="text-4xl md:text-5xl font-black text-yellow-400 tracking-tighter">{pendingStones}</p>
              </div>
              <div className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)] md:group-hover:scale-110 transition-transform duration-500">
                <Clock className="h-6 w-6 md:h-8 md:w-8" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Main Content Area */}
          <div className="xl:w-3/4 space-y-8">
            {/* Search and Filters */}
            <Card className="backdrop-blur-3xl bg-white/5 border-white/5 shadow-2xl rounded-[2rem] overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5 group-hover:text-blue-400 transition-colors" />
                <Input
                  type="text"
                  placeholder="Search stones by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white placeholder-white/40 rounded-2xl focus:bg-white/10 transition-all shadow-inner text-base"
                />
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all font-semibold border border-white/10">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={nameFilter} onValueChange={setNameFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all font-semibold border border-white/10">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                    <SelectItem value="all">All Types</SelectItem>
                    {stoneTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-2xl font-bold transition-all px-6">
                      <Download className="h-5 w-5 mr-2" />
                      Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer rounded-xl" onClick={() => handleExport('all')}>All Stones (Print/PDF)</DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer rounded-xl" onClick={() => handleExport('day')}>Today (Print/PDF)</DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer rounded-xl" onClick={() => handleExport('week')}>This Week (Print/PDF)</DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-white/10 cursor-pointer rounded-xl" onClick={() => handleExport('month')}>This Month (Print/PDF)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stones Table */}
        <Card className="backdrop-blur-3xl bg-white/5 border-white/10 text-white shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-6 md:p-8 pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Stone Inventory</CardTitle>
            <CardDescription className="text-white/40 font-medium">
              Complete list of all stones with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="overflow-x-auto">
              <div className="border-y md:border border-white/10 md:rounded-[2rem] overflow-hidden backdrop-blur-sm bg-white/[0.02]">
                <Table>
                  <TableHeader>
                    <TableRow className="backdrop-blur-sm bg-white/10">
                      <TableHead className="text-white px-4 py-3">ID</TableHead>
                      <TableHead className="text-white px-4 py-3">Name</TableHead>
                      <TableHead className="text-white px-4 py-3">Images</TableHead>
                      <TableHead className="text-white px-4 py-3">Weight (Rough)</TableHead>
                      <TableHead className="text-white px-4 py-3">Weight</TableHead>
                      <TableHead className="text-white px-4 py-3">Stone Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Cutting Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Polish Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Treatment Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Other Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Total Cost</TableHead>
                      <TableHead className="text-white px-4 py-3">Status</TableHead>
                      <TableHead className="text-white px-4 py-3">Price to Sell</TableHead>
                      <TableHead className="text-white px-4 py-3">Sold Price</TableHead>
                      <TableHead className="text-white px-4 py-3">Treatment</TableHead>
                      <TableHead className="text-white px-4 py-3">Profit/Loss</TableHead>
                      <TableHead className="text-white px-4 py-3">Created Date</TableHead>
                      <TableHead className="text-white px-4 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStones.map((stone) => (
                      <TableRow key={stone.id} className="border-white/10 hover:bg-white/5 transition-colors">
                        <TableCell className="text-white font-mono text-sm px-4 py-3">
                          {stone.customId ?? String(stones.length - stones.findIndex(s => s.id === stone.id)).padStart(3, '0')}
                        </TableCell>
                        <TableCell className="text-white font-medium px-4 py-3">{stone.name}</TableCell>
                        <TableCell className="px-4 py-3">
                          {stone.images && stone.images.length > 0 ? (
                            <div className="flex gap-1">
                              {stone.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Stone ${index + 1}`}
                                  className="w-8 h-8 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => openImageModal(image)}
                                />
                              ))}
                              {stone.images.length > 3 && (
                                <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-white/60">
                                  +{stone.images.length - 3}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/40 text-sm">No images</span>
                          )}
                        </TableCell>
                        <TableCell className="text-white px-4 py-3">{stone.weightInRough} ct</TableCell>
                        <TableCell className="text-white px-4 py-3">{stone.weight} ct</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.stoneCost.toLocaleString()}</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.cuttingCost.toLocaleString()}</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.polishCost.toLocaleString()}</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.treatmentCost.toLocaleString()}</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.otherCost.toLocaleString()}</TableCell>
                        <TableCell className="text-white font-semibold px-4 py-3 bg-white/5">
                          LKR {stone.totalCost.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3">{getStatusBadge(stone.status)}</TableCell>
                        <TableCell className="text-white px-4 py-3">LKR {stone.priceToSell.toLocaleString()}</TableCell>
                        <TableCell className="text-white px-4 py-3">
                          {stone.soldPrice > 0 ? `LKR ${stone.soldPrice.toLocaleString()}` : '---'}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant="outline">{stone.treatment}</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">{getProfitLossDisplay(stone.profitLoss)}</TableCell>
                        <TableCell className="text-white text-sm px-4 py-3">
                          {stone.createdAt.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingStone(stone)}
                              className="text-white/60 hover:text-white hover:bg-blue-500/20 rounded-xl"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStoneReport(stone)}
                              className="text-white/60 hover:text-white hover:bg-green-500/20 rounded-xl"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStone(stone.id)}
                              className="text-white/60 hover:text-white hover:bg-red-500/20 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
          </Card>
        </div> {/* End Main Content Area */}

        {/* Live Activity Sidebar */}
        <div className="xl:w-1/4">
          <Card className="backdrop-blur-3xl bg-white/5 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden sticky top-8">
            <CardHeader className="p-6 md:p-8 pb-4 border-b border-white/10">
              <CardTitle className="text-xl font-bold text-white flex items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse mr-3 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="relative border-l-2 border-white/10 ml-3 space-y-8 pb-4">
                {[...stones]
                  .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
                  .slice(0, 10)
                  .map((stone) => {
                    const isNew = Math.abs(stone.updatedAt.getTime() - stone.createdAt.getTime()) < 1000;
                    const isSold = stone.status === "Sold";
                    
                    let iconBg = "bg-blue-500/20";
                    let iconColor = "text-blue-400";
                    let glowColor = "shadow-[0_0_15px_rgba(59,130,246,0.3)]";
                    let actionText = "Modified";
                    let IconComponent = Edit;

                    if (isSold) {
                      iconBg = "bg-red-500/20";
                      iconColor = "text-red-400";
                      glowColor = "shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                      actionText = "Sold";
                      IconComponent = ShoppingCart;
                    } else if (isNew) {
                      iconBg = "bg-green-500/20";
                      iconColor = "text-green-400";
                      glowColor = "shadow-[0_0_15px_rgba(34,197,94,0.3)]";
                      actionText = "Added";
                      IconComponent = Plus;
                    }

                    return (
                      <div key={`timeline-${stone.id}`} className="relative pl-6 sm:pl-8 group">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border border-slate-900 ${iconBg} ${iconColor} ${glowColor} flex items-center justify-center`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        
                        {/* Content Card */}
                        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-white text-sm">{stone.name}</span>
                            <span className="text-xs font-mono text-white/40">{stone.customId ?? String(stone.customIdNum).padStart(3, '0')}</span>
                          </div>
                          <div className="text-sm text-white/70 mb-2">
                            {actionText} <span className="text-white font-medium">{stone.weight}ct</span>
                          </div>
                          <div className="text-xs text-white/40 font-medium">
                            {stone.updatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {stone.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                          </div>
                        </div>
                      </div>
                    );
                })}
              </div>
            </CardContent>
          </Card>
        </div> {/* End Live Activity Sidebar */}
      </div>

        {/* Add Stone Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl md:rounded-[2rem] p-0 border-none">
            <div className="p-6 md:p-10 space-y-8">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">Add New Stone</DialogTitle>
              </DialogHeader>
              <AddStoneForm onSubmit={handleAddStone} onCancel={() => setShowAddDialog(false)} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Stone Dialog */}
        <Dialog open={!!editingStone} onOpenChange={() => setEditingStone(null)}>
          <DialogContent className="max-w-7xl w-[95vw] md:w-[90vw] max-h-[92vh] overflow-y-auto backdrop-blur-3xl bg-slate-950/80 border border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl md:rounded-[2rem] p-0 border-none">
            <div className="p-6 md:p-10 space-y-8">
              <DialogHeader className="pb-4">
                <DialogTitle className="text-3xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent">Edit Stone</DialogTitle>
              </DialogHeader>
              {editingStone && (
                <EditStoneForm 
                  stone={editingStone} 
                  onSubmit={(updatedData) => handleEditStone(editingStone.id, updatedData)} 
                  onCancel={() => setEditingStone(null)} 
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="backdrop-blur-3xl bg-slate-950/90 border-white/10 text-white shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-3xl md:rounded-[2rem] max-w-5xl">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-2xl font-black">Stone Image</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Stone" 
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Add Stone Form Component
  function AddStoneForm({ onSubmit, onCancel }: { onSubmit: (stone: NewStone) => void; onCancel: () => void }) {
    const [formData, setFormData] = useState<NewStone>({
      name: "",
      weightInRough: 0,
      weight: 0,
      stoneCost: 0,
      cuttingCost: 0,
      polishCost: 0,
      treatmentCost: 0,
      otherCost: 0,
      status: "In Stock",
      priceToSell: 0,
      soldPrice: 0,
      treatment: "Natural",
      images: []
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ ...formData, images: uploadedImages });
    };

    const handleImageUpload = async (files: FileList | null) => {
      if (!files) return;

      setUploadingImages(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          const storageRef = ref(storage, `stones/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });

        const newImages = await Promise.all(uploadPromises);
        setUploadedImages([...uploadedImages, ...newImages]);
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        setUploadingImages(false);
      }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleImageUpload(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleImageUpload(e.dataTransfer.files);
    };

    const removeImage = async (index: number) => {
      const imageToRemove = uploadedImages[index];
      
      // Delete from Firebase Storage if it's a Firebase Storage URL
      if (imageToRemove && imageToRemove.includes('firebasestorage.googleapis.com')) {
        try {
          const imageRef = ref(storage, imageToRemove);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image from storage:', error);
        }
      }
      
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue placeholder="Select stone type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {stoneTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="weightInRough">Weight in Rough (ct)</Label>
            <Input
              id="weightInRough"
              type="number"
              step="0.01"
              value={formData.weightInRough}
              onChange={(e) => setFormData({...formData, weightInRough: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="weight">Weight (ct)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="stoneCost">Stone Cost (LKR)</Label>
            <Input
              id="stoneCost"
              type="number"
              value={formData.stoneCost}
              onChange={(e) => setFormData({...formData, stoneCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="cuttingCost">Cutting Cost (LKR)</Label>
            <Input
              id="cuttingCost"
              type="number"
              value={formData.cuttingCost}
              onChange={(e) => setFormData({...formData, cuttingCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="polishCost">Polish Cost (LKR)</Label>
            <Input
              id="polishCost"
              type="number"
              value={formData.polishCost}
              onChange={(e) => setFormData({...formData, polishCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="treatmentCost">Treatment Cost (LKR)</Label>
            <Input
              id="treatmentCost"
              type="number"
              value={formData.treatmentCost}
              onChange={(e) => setFormData({...formData, treatmentCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="otherCost">Other Cost (LKR)</Label>
            <Input
              id="otherCost"
              type="number"
              value={formData.otherCost}
              onChange={(e) => setFormData({...formData, otherCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="priceToSell">Price to Sell (LKR)</Label>
            <Input
              id="priceToSell"
              type="number"
              value={formData.priceToSell}
              onChange={(e) => setFormData({...formData, priceToSell: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Total Cost (LKR)</Label>
            <span className="text-2xl font-bold text-green-400">
              LKR {(formData.stoneCost + formData.cuttingCost + formData.polishCost + formData.treatmentCost + formData.otherCost).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="soldPrice">Sold Price (LKR)</Label>
            <Input
              id="soldPrice"
              type="number"
              value={formData.soldPrice}
              onChange={(e) => setFormData({...formData, soldPrice: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              placeholder="0 if not sold"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: "In Stock" | "Sold" | "Pending") => setFormData({...formData, status: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="treatment">Treatment</Label>
            <Select value={formData.treatment} onValueChange={(value: "Natural" | "Heat" | "Electric") => setFormData({...formData, treatment: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {treatmentOptions.map(treatment => (
                  <SelectItem key={treatment} value={treatment}>{treatment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Stone Images</Label>
            {uploadingImages && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>
          <div 
            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="image-upload"
              disabled={uploadingImages}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              {uploadingImages ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mb-2"></div>
                  <p className="text-white/60">Uploading images...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-white/60" />
                  <p className="text-white/60">Click to upload images or drag and drop</p>
                  <p className="text-sm text-white/40">Supports: JPG, PNG, GIF</p>
                </>
              )}
            </label>
          </div>
          
          {/* Image Preview */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Stone ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      // This will be handled by the parent component
                      const event = new CustomEvent('openImageModal', { detail: image });
                      window.dispatchEvent(event);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/10">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-2xl font-bold transition-all px-8">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg px-8 border-none">
            Add Stone
          </Button>
        </div>
      </form>
    );
  }

  // Edit Stone Form Component
  function EditStoneForm({ stone, onSubmit, onCancel }: { stone: Stone; onSubmit: (updatedData: Partial<Stone>) => void; onCancel: () => void }) {
    const [formData, setFormData] = useState({
      name: stone.name,
      weightInRough: stone.weightInRough,
      weight: stone.weight,
      stoneCost: stone.stoneCost,
      cuttingCost: stone.cuttingCost,
      polishCost: stone.polishCost,
      treatmentCost: stone.treatmentCost,
      otherCost: stone.otherCost,
      status: stone.status,
      priceToSell: stone.priceToSell,
      soldPrice: stone.soldPrice,
      treatment: stone.treatment
    });
    const [uploadedImages, setUploadedImages] = useState<string[]>(stone.images || []);
    const [uploadingImages, setUploadingImages] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({ ...formData, images: uploadedImages });
    };

    const handleImageUpload = async (files: FileList | null) => {
      if (!files) return;

      setUploadingImages(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          const storageRef = ref(storage, `stones/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        });

        const newImages = await Promise.all(uploadPromises);
        setUploadedImages([...uploadedImages, ...newImages]);
      } catch (error) {
        console.error('Error uploading images:', error);
      } finally {
        setUploadingImages(false);
      }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleImageUpload(e.target.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      handleImageUpload(e.dataTransfer.files);
    };

    const removeImage = async (index: number) => {
      const imageToRemove = uploadedImages[index];
      
      // Delete from Firebase Storage if it's a Firebase Storage URL
      if (imageToRemove && imageToRemove.includes('firebasestorage.googleapis.com')) {
        try {
          const imageRef = ref(storage, imageToRemove);
          await deleteObject(imageRef);
        } catch (error) {
          console.error('Error deleting image from storage:', error);
        }
      }
      
      setUploadedImages(uploadedImages.filter((_, i) => i !== index));
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Select value={formData.name} onValueChange={(value) => setFormData({...formData, name: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {stoneTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-weightInRough">Weight in Rough (ct)</Label>
            <Input
              id="edit-weightInRough"
              type="number"
              step="0.01"
              value={formData.weightInRough}
              onChange={(e) => setFormData({...formData, weightInRough: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-weight">Weight (ct)</Label>
            <Input
              id="edit-weight"
              type="number"
              step="0.01"
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="edit-stoneCost">Stone Cost (LKR)</Label>
            <Input
              id="edit-stoneCost"
              type="number"
              value={formData.stoneCost}
              onChange={(e) => setFormData({...formData, stoneCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-cuttingCost">Cutting Cost (LKR)</Label>
            <Input
              id="edit-cuttingCost"
              type="number"
              value={formData.cuttingCost}
              onChange={(e) => setFormData({...formData, cuttingCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-polishCost">Polish Cost (LKR)</Label>
            <Input
              id="edit-polishCost"
              type="number"
              value={formData.polishCost}
              onChange={(e) => setFormData({...formData, polishCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="edit-treatmentCost">Treatment Cost (LKR)</Label>
            <Input
              id="edit-treatmentCost"
              type="number"
              value={formData.treatmentCost}
              onChange={(e) => setFormData({...formData, treatmentCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-otherCost">Other Cost (LKR)</Label>
            <Input
              id="edit-otherCost"
              type="number"
              value={formData.otherCost}
              onChange={(e) => setFormData({...formData, otherCost: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-priceToSell">Price to Sell (LKR)</Label>
                        <Input
                id="edit-priceToSell"
                type="number"
                value={formData.priceToSell}
                onChange={(e) => setFormData({...formData, priceToSell: parseFloat(e.target.value) || 0})}
                className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
                required
              />
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Total Cost (LKR)</Label>
            <span className="text-2xl font-bold text-green-400">
              LKR {(formData.stoneCost + formData.cuttingCost + formData.polishCost + formData.treatmentCost + formData.otherCost).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <Label htmlFor="edit-soldPrice">Sold Price (LKR)</Label>
            <Input
              id="edit-soldPrice"
              type="number"
              value={formData.soldPrice}
              onChange={(e) => setFormData({...formData, soldPrice: parseFloat(e.target.value) || 0})}
              className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4"
              placeholder="0 if not sold"
            />
          </div>
          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={(value: "In Stock" | "Sold" | "Pending") => setFormData({...formData, status: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-treatment">Treatment</Label>
            <Select value={formData.treatment} onValueChange={(value: "Natural" | "Heat" | "Electric") => setFormData({...formData, treatment: value})}>
              <SelectTrigger className="h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white rounded-2xl focus:bg-white/10 transition-all shadow-inner px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                {treatmentOptions.map(treatment => (
                  <SelectItem key={treatment} value={treatment}>{treatment}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Stone Images</Label>
            {uploadingImages && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <div className="h-4 w-4 rounded-full border-2 border-white/40 border-t-transparent animate-spin"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>
          <div 
            className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
              id="edit-image-upload"
              disabled={uploadingImages}
            />
            <label htmlFor="edit-image-upload" className="cursor-pointer">
              {uploadingImages ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mb-2"></div>
                  <p className="text-white/60">Uploading images...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-white/60" />
                  <p className="text-white/60">Click to upload images or drag and drop</p>
                  <p className="text-sm text-white/40">Supports: JPG, PNG, GIF</p>
                </>
              )}
            </label>
          </div>
          
          {/* Image Preview */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Stone ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      const event = new CustomEvent('openImageModal', { detail: image });
                      window.dispatchEvent(event);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/10">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto h-14 backdrop-blur-3xl bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-2xl font-bold transition-all px-8">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg px-8 border-none">
            Update Stone
          </Button>
        </div>
      </form>
    );
  }
