"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, Trash2, Eye, Upload, X } from "lucide-react";
import { format, differenceInDays, parseISO, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc, getDocs, where, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
// If the file exists at the correct path, ensure it is named 'customCard.tsx' and exports 'CustomCard'.
// If the file is named differently or located elsewhere, update the import path accordingly.
// Example if the file is named 'CustomCard.tsx':
import CustomCard from "@/components/sub-componets/CustomCard";

// Interfaces
interface Remainder {
  id: string;
  stoneName: string;
  stoneWeight: number;
  stoneCost: number;
  sellingPrice: number;
  myProfit: number;
  partyReceives: number;
  sellingDate: Date;
  paymentReceivingDate: Date;
  durationInDays: number;
  archivedAt?: Date;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
  receiptImage?: string;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
}

interface NewRemainder {
  stoneName: string;
  stoneWeight: number;
  stoneCost: number;
  sellingPrice: number;
  myProfit: number;
  partyReceives: number;
  sellingDate: Date;
  paymentReceivingDate: Date;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
}

export default function RemaindersPage() {
  const router = useRouter();
  const [remainders, setRemainders] = useState<Remainder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRemainder, setEditingRemainder] = useState<Remainder | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedRemainder, setSelectedRemainder] = useState<Remainder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // add archive state + handler (archives persisted to Firestore)
  const [archives, setArchives] = useState<Remainder[]>([]);
  useEffect(() => {
    const q = query(collection(db, "archives"), orderBy("archivedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const archivesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sellingDate: parseISO(doc.data().sellingDate.toDate().toISOString()),
        paymentReceivingDate: parseISO(doc.data().paymentReceivingDate.toDate().toISOString()),
        createdAt: parseISO(doc.data().createdAt.toDate().toISOString()),
        updatedAt: parseISO(doc.data().updatedAt.toDate().toISOString()),
        archivedAt: doc.data().archivedAt ? parseISO(doc.data().archivedAt.toDate().toISOString()) : undefined,
      })) as Remainder[];
      setArchives(archivesData);
    });
    return () => unsubscribe();
  }, []);
  const [showArchivesModal, setShowArchivesModal] = useState(false);
  // show details for a specific archived card
  const [selectedArchive, setSelectedArchive] = useState<Remainder | null>(null);
  const [showArchiveDetailModal, setShowArchiveDetailModal] = useState(false);
  const openArchiveDetail = (arc: Remainder) => {
    setSelectedArchive(arc);
    setShowArchiveDetailModal(true);
  };

  // Helper function to calculate days remaining from today
  const calculateDaysRemaining = (paymentDate: Date | string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    const payment = typeof paymentDate === 'string' ? new Date(paymentDate) : new Date(paymentDate);
    payment.setHours(0, 0, 0, 0);
    return differenceInDays(payment, today);
  };

  // Helper function to get current status based on payment date
  const getCurrentStatus = (paymentDate: Date, originalStatus: string) => {
    if (originalStatus === "paid") return "paid";
    const daysRemaining = calculateDaysRemaining(paymentDate);
    return daysRemaining < 0 ? "overdue" : "pending";
  };

  // Fetch remainders from Firebase
  useEffect(() => {
    const q = query(collection(db, "remainders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remaindersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        sellingDate: parseISO(doc.data().sellingDate.toDate().toISOString()),
        paymentReceivingDate: parseISO(doc.data().paymentReceivingDate.toDate().toISOString()),
        createdAt: parseISO(doc.data().createdAt.toDate().toISOString()),
        updatedAt: parseISO(doc.data().updatedAt.toDate().toISOString()),
      })) as Remainder[];
      setRemainders(remaindersData);
    });

    return () => unsubscribe();
  }, []);

  const handleAddRemainder = async (data: NewRemainder & { receiptImage?: string }) => {
    try {
      console.log("Adding remainder with data:", data);
      
      const durationInDays = differenceInDays(data.paymentReceivingDate, data.sellingDate);
      const status = durationInDays < 0 ? "overdue" : "pending";
      
      const remainderData = {
        ...data,
        durationInDays,
        status,
        receiptImage: data.receiptImage || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log("Processed remainder data:", remainderData);
      
      const docRef = await addDoc(collection(db, "remainders"), remainderData);
      console.log("Remainder added successfully with ID:", docRef.id);
      
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding remainder:", error);
      alert(`Failed to add remainder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateRemainder = async (id: string, data: Partial<Remainder>) => {
    try {
      const remainder = remainders.find(r => r.id === id);
      if (remainder) {
        const durationInDays = differenceInDays(
          data.paymentReceivingDate || remainder.paymentReceivingDate, 
          data.sellingDate || remainder.sellingDate
        );
        const status = durationInDays < 0 ? "overdue" : "pending";
        
        await updateDoc(doc(db, "remainders", id), {
          ...data,
          durationInDays,
          status,
          updatedAt: new Date(),
        });
        setEditingRemainder(null);
      }
    } catch (error) {
      console.error("Error updating remainder:", error);
    }
  };

  const handleDeleteRemainder = async (id: string) => {
    if (confirm("Are you sure you want to delete this remainder?")) {
      try {
        const remainder = remainders.find(r => r.id === id);
        if (remainder?.receiptImage) {
          try {
            const imageRef = ref(storage, remainder.receiptImage);
            await deleteObject(imageRef);
          } catch (error) {
            console.error("Error deleting receipt image:", error);
          }
        }
        await deleteDoc(doc(db, "remainders", id));
      } catch (error) {
        console.error("Error deleting remainder:", error);
      }
    }
  };

  const openReceiptModal = (receiptUrl: string) => {
    setSelectedReceipt(receiptUrl);
    setShowReceiptModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-500">Overdue</Badge>;
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>;
    }
  };

  const handleArchiveRemainder = async (id: string) => {
    const rem = remainders.find(r => r.id === id);
    if (!rem) return;
    const archivedData = {
      ...rem,
      paymentReceived: true,
      status: "paid",
      archivedAt: new Date(),
    } as any;

    try {
      // persist to Firestore 'archives' collection
      await addDoc(collection(db, "archives"), {
        ...archivedData,
        // ensure Firestore gets proper Date objects
        sellingDate: rem.sellingDate,
        paymentReceivingDate: rem.paymentReceivingDate,
        createdAt: rem.createdAt,
        updatedAt: new Date(),
        archivedAt: new Date(),
      });

      // remove from remainders collection
      await deleteDoc(doc(db, "remainders", id));

      // update local state for immediate UI feedback
      setArchives((prev) => [archivedData as Remainder, ...prev]);
      setRemainders((prev) => prev.filter((r) => r.id !== id));

      // close any open detail/edit modals for that remainder
      if (selectedRemainder?.id === id) {
        setSelectedRemainder(null);
        setShowDetailModal(false);
      }
      if (editingRemainder?.id === id) {
        setEditingRemainder(null);
      }
    } catch (error) {
      console.error("Error archiving remainder:", error);
      alert("Failed to archive remainder. See console for details.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Primary Add Remainder Button */}
      <Button 
        onClick={() => {
          console.log("Add Remainder button clicked!");
          setShowAddForm(true);
        }}
        className="fixed top-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-xl backdrop-blur-sm border border-white/20"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Remainder
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Remainders System</h1>
          <p className="text-white/60">Track stone sales and payment schedules</p>
        </div>
      </div>

      {/* Dialog moved outside the button container */}
      <Dialog   
        open={showAddForm} 
        onOpenChange={(open) => {
          console.log("Dialog onOpenChange called with:", open);
          setShowAddForm(open);
        }}
      >
        <DialogContent className="max-w-6xl w-[90vw] max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-white/5 border border-white/20 text-white shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-white text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text ">
              Add New Remainder
            </DialogTitle>
          </DialogHeader>
          <AddRemainderForm onSubmit={handleAddRemainder} onCancel={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Total Remainders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{remainders.length}</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-400">
              {remainders.filter(r => getCurrentStatus(r.paymentReceivingDate, r.status) === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {remainders.filter(r => getCurrentStatus(r.paymentReceivingDate, r.status) === "overdue").length}
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              LKR {remainders.reduce((sum, r) => sum + r.sellingPrice, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Next Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-400">
              {
                (() => {
                  const pending = remainders.filter(r => getCurrentStatus(r.paymentReceivingDate, r.status) === "pending");
                  if (pending.length === 0) return "No pending";
                  const minDays = Math.min(...pending.map(r => calculateDaysRemaining(r.paymentReceivingDate)));
                  if (minDays === 0) return "Due today";
                  return `${minDays} days`;
                })()
              }
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold">{archives.length > 0 ? archives.length : "Loading..."}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/remainders/archives")}
                className="text-green-400 hover:text-green-300 h-8 px-2"
              >
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Remainders Table */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">All Remainders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {remainders.map((remainder) => (
              <CustomCard
                key={remainder.id}
                remainder={remainder}
                onDetail={() => {
                  setSelectedRemainder(remainder);
                  setShowDetailModal(true);
                }}
                onEdit={() => setEditingRemainder(remainder)}
                onDelete={() => handleDeleteRemainder(remainder.id)}
                onArchive={() => handleArchiveRemainder(remainder.id)}
                onViewReceipt={() => remainder.receiptImage && openReceiptModal(remainder.receiptImage)}
                getStatusBadge={getStatusBadge}
                calculateDaysRemaining={calculateDaysRemaining}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      {editingRemainder && (
        <Dialog open={!!editingRemainder} onOpenChange={() => setEditingRemainder(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto backdrop-blur-md bg-white/10 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl font-bold">Edit Remainder</DialogTitle>
            </DialogHeader>
            <EditRemainderForm 
              remainder={editingRemainder} 
              onSubmit={(data: Partial<Remainder>) => handleUpdateRemainder(editingRemainder.id, data)} 
              onCancel={() => setEditingRemainder(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Image Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-4xl backdrop-blur-md bg-white/10 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Receipt Image</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedReceipt && (
              <img
                src={selectedReceipt}
                alt="Receipt"
                className="max-w-full max-h-96 object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl w-full md:w-[90vw] lg:w-[60vw] xl:w-[50vw] backdrop-blur-xl bg-white/5 border border-white/20 text-white shadow-2xl overflow-x-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-white text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text ">
              {selectedRemainder?.stoneName} - Full Details
            </DialogTitle>
          </DialogHeader>
          {selectedRemainder && (
            <div className="space-y-6 w-full">
              {/* Stone Details Section */}
              <div className="p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 w-full">
                <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2 mb-4">Stone Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <span className="text-white/60">Stone Name:</span>
                    <p className="text-white font-semibold">{selectedRemainder.stoneName}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Weight:</span>
                    <p className="text-white font-semibold">{selectedRemainder.stoneWeight}crt</p>
                  </div>
                  <div>
                    <span className="text-white/60">Stone Cost:</span>
                    <p className="text-white font-semibold">LKR {selectedRemainder.stoneCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Selling Price:</span>
                    <p className="text-white font-semibold">LKR {selectedRemainder.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">My Profit:</span>
                    <p className="text-green-400 font-semibold">LKR {selectedRemainder.myProfit?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Party Receives:</span>
                    <p className="text-blue-400 font-semibold">LKR {selectedRemainder.partyReceives?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              {/* Dates Section */}
              <div className="p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 w-full">
                <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2 mb-4">Important Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <span className="text-white/60">Selling Date:</span>
                    <p className="text-white font-semibold">{format(selectedRemainder.sellingDate, "PPP")}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Payment Due Date:</span>
                    <p className="text-white font-semibold">{format(selectedRemainder.paymentReceivingDate, "PPP")}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <span className="text-white/60">Duration:</span>
                    <p className={`font-bold text-lg ${selectedRemainder.durationInDays < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {selectedRemainder.durationInDays < 0 ? 
                        `${Math.abs(selectedRemainder.durationInDays)} days overdue` : 
                        `${selectedRemainder.durationInDays} days remaining`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Ownership & Buyer Section */}
              <div className="p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 w-full">
                <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2 mb-4">Ownership & Buyer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <span className="text-white/60">Stone Ownership:</span>
                    <p className="text-white font-semibold">{selectedRemainder.stoneOwner === "me" ? "My Stone" : "Borrowed Stone"}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Buyer Type:</span>
                    <p className="text-white font-semibold">{selectedRemainder.buyerType === "local" ? "Local Person" : "Chinese"}</p>
                  </div>
                  {selectedRemainder.ownerName && (
                    <div>
                      <span className="text-white/60">Owner Name:</span>
                      <p className="text-white font-semibold">{selectedRemainder.ownerName}</p>
                    </div>
                  )}
                  {selectedRemainder.buyerName && (
                    <div>
                      <span className="text-white/60">Buyer Name:</span>
                      <p className="text-white font-semibold">{selectedRemainder.buyerName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 w-full">
                <h3 className="text-xl font-bold text-white border-b border-white/20 pb-2 mb-4">Status & Actions</h3>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-white/60">Status:</span>
                    {getStatusBadge(selectedRemainder.status)}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRemainder(selectedRemainder);
                        setShowDetailModal(false);
                      }}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>

                    {/* Payment Received in detail modal */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleArchiveRemainder(selectedRemainder.id);
                        setShowDetailModal(false);
                      }}
                      className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      Payment Received
                    </Button>

                    {selectedRemainder.receiptImage && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          openReceiptModal(selectedRemainder.receiptImage!);
                          setShowDetailModal(false);
                        }}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Archives Modal */}
      <Dialog open={showArchivesModal} onOpenChange={setShowArchivesModal}>
        <DialogContent className="max-w-4xl backdrop-blur-md bg-white/10 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">Archived Remainders</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {archives.length === 0 && (
              <p className="text-white/60">No archived items.</p>
            )}
            {archives.map((arc) => (
              <div
                key={arc.id}
                className="p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => openArchiveDetail(arc)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-white">{arc.stoneName}</h4>
                  <span className="text-white/60">{arc.buyerType === "local" ? "Local" : "Chinese"}</span>
                </div>
                <div className="text-sm text-white/80">
                  <div>Weight: {arc.stoneWeight}crt</div>
                  <div>Selling Price: LKR {arc.sellingPrice.toLocaleString()}</div>
                  <div>Archived: {arc.archivedAt ? "Yes" : "No"}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Archived Remainder Detail Dialog */}
      <Dialog open={showArchiveDetailModal} onOpenChange={setShowArchiveDetailModal}>
        <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/5 border border-white/20 text-white shadow-2xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-white text-2xl font-bold">
              {selectedArchive?.stoneName || "Archive detail"}
            </DialogTitle>
          </DialogHeader>
          {selectedArchive && (
            <div className="space-y-6">
              <div className="p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Stone Information</h4>
                <div className="grid grid-cols-2 gap-3 text-white/90">
                  <div>
                    <span className="text-white/60">Weight:</span>
                    <p className="font-medium">{selectedArchive.stoneWeight}crt</p>
                  </div>
                  <div>
                    <span className="text-white/60">Selling Price:</span>
                    <p className="font-medium">LKR {selectedArchive.sellingPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Stone Cost:</span>
                    <p className="font-medium">LKR {selectedArchive.stoneCost.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">My Profit:</span>
                    <p className="text-green-400 font-medium">LKR {selectedArchive.myProfit?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Buyer & Ownership</h4>
                <div className="grid grid-cols-2 gap-3 text-white/90">
                  <div>
                    <span className="text-white/60">Buyer Type:</span>
                    <p className="font-medium">{selectedArchive.buyerType === "local" ? "Local" : "Chinese"}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Buyer Name:</span>
                    <p className="font-medium">{selectedArchive.buyerName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Stone Owner:</span>
                    <p className="font-medium">{selectedArchive.stoneOwner === "me" ? "My Stone" : "Borrowed"}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Owner Name:</span>
                    <p className="font-medium">{selectedArchive.ownerName || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">Dates</h4>
                <div className="grid grid-cols-2 gap-3 text-white/90">
                  <div>
                    <span className="text-white/60">Selling Date:</span>
                    <p className="font-medium">{format(selectedArchive.sellingDate, "PPP")}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Payment Received / Due:</span>
                    <p className="font-medium">{format(selectedArchive.paymentReceivingDate, "PPP")}</p>
                  </div>
                </div>
              </div>

              {selectedArchive.receiptImage && (
                <div className="p-4 flex justify-center">
                  <img src={selectedArchive.receiptImage} alt="Receipt" className="max-w-full max-h-64 object-contain rounded-lg" />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowArchiveDetailModal(false)} className="border-white/20 text-white">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Remainder Form Component - Main Form with 3 columns
function AddRemainderForm({ onSubmit, onCancel }: { 
  onSubmit: (data: NewRemainder & { receiptImage?: string }) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<NewRemainder>({
    stoneName: "",
    stoneWeight: 0,
    stoneCost: 0,
    sellingPrice: 0,
    myProfit: 0,
    partyReceives: 0,
    sellingDate: new Date(),
    paymentReceivingDate: new Date(),
    stoneOwner: "me",
    ownerName: "",
    buyerType: "local",
    buyerName: "",
  });
  // Stone ID autofill states
  const [stoneIdInput, setStoneIdInput] = useState<string>("");
  const [stoneLoading, setStoneLoading] = useState(false);
  const [stoneFetchError, setStoneFetchError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  
  // AddRemainderForm specific handlers

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, receiptImage });
  };

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingReceipt(true);
    try {
      const file = files[0];
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setReceiptImage(downloadURL);
    } catch (error) {
      console.error("Error uploading receipt:", error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = async () => {
    if (receiptImage) {
      try {
        const imageRef = ref(storage, receiptImage);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting receipt:", error);
      }
      setReceiptImage("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleReceiptUpload(e.dataTransfer.files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col items-center  gap-6">
        {/* Stone Details - AddRemainderForm */}
        <div className="space-y-4 p-4  backdrop-blur-sm bg-white/5   rounded-lg border border-white/10 w-full ">
          <h3 className="text-lg md:text-xl font-bold text-white border-b border-white/20 pb-2">Stone Details</h3>
          
          <div className="space-y-2 ">
            <Label htmlFor="stoneName" className="text-white text-sm font-medium">Stone Name</Label>
            <Input
              id="stoneName"
              value={formData.stoneName}
              onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="Enter stone name"
              required
            />
          </div>

          {/* My Stone ID - visible when stoneOwner is 'me' */}
          {formData.stoneOwner === 'me' && (
            <div className="space-y-2">
              <Label htmlFor="stoneId" className="text-white text-sm font-medium">My Stone ID (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="stoneId"
                  value={stoneIdInput}
                  onChange={(e) => setStoneIdInput(e.target.value)}
                  placeholder="Enter stone doc ID or custom ID"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  type="button"
                  onClick={async () => {
                    // fetch stone by id or custom id
                    if (!stoneIdInput) return;
                    setStoneLoading(true);
                    setStoneFetchError(null);
                    try {
                      // Try getDoc by document id first
                      const docRef = doc(db, 'stones', stoneIdInput);
                      const snap = await getDoc(docRef);
                      if (snap.exists()) {
                        const data: any = snap.data();
                        setFormData({
                          ...formData,
                          stoneName: data.name || data.stoneName || formData.stoneName,
                          stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                          stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                        });
                        setStoneLoading(false);
                        return;
                      }

                      // fallback: query by customId or customIdNum
                      const q1 = query(collection(db, 'stones'), where('customId', '==', stoneIdInput), limit(1));
                      const res1 = await getDocs(q1);
                      if (!res1.empty) {
                        const data = res1.docs[0].data() as any;
                        setFormData({
                          ...formData,
                          stoneName: data.name || data.stoneName || formData.stoneName,
                          stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                          stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                        });
                        setStoneLoading(false);
                        return;
                      }

                      // try numeric customIdNum
                      const num = Number(stoneIdInput);
                      if (!Number.isNaN(num)) {
                        const q2 = query(collection(db, 'stones'), where('customIdNum', '==', num), limit(1));
                        const res2 = await getDocs(q2);
                        if (!res2.empty) {
                          const data = res2.docs[0].data() as any;
                          setFormData({
                            ...formData,
                            stoneName: data.name || data.stoneName || formData.stoneName,
                            stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                            stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                          });
                          setStoneLoading(false);
                          return;
                        }
                      }

                      setStoneFetchError('Stone not found for provided ID');
                    } catch (err) {
                      console.error('Error fetching stone:', err);
                      setStoneFetchError('Failed to fetch stone');
                    } finally {
                      setStoneLoading(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {stoneLoading ? 'Loading...' : 'Load'}
                </Button>
              </div>
              {stoneFetchError && <p className="text-sm text-red-400 mt-1">{stoneFetchError}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="stoneWeight" className="text-white text-sm font-medium">Weight (crt)</Label>
            <Input
              id="stoneWeight"
              type="number"
              step="0.01"
              value={formData.stoneWeight}
              onChange={(e) => setFormData({ ...formData, stoneWeight: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stoneCost" className="text-white text-sm font-medium">Stone Cost (LKR)</Label>
            <Input
              id="stoneCost"
              type="number"
              step="0.01"
              value={formData.stoneCost}
              onChange={(e) => setFormData({ ...formData, stoneCost: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellingPrice" className="text-white text-sm font-medium">Selling Price (LKR)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="myProfit" className="text-white text-sm font-medium">My Profit (LKR)</Label>
            <Input
              id="myProfit"
              type="number"
              step="0.01"
              value={formData.myProfit}
              onChange={(e) => setFormData({ ...formData, myProfit: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="partyReceives" className="text-white text-sm font-medium">Party Receives (LKR)</Label>
            <Input
              id="partyReceives"
              type="number"
              step="0.01"
              value={formData.partyReceives}
              onChange={(e) => setFormData({ ...formData, partyReceives: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Dates and Ownership */}
        <div className="space-y-4 p-4 md:p-6 backdrop-blur-sm bg-white/5 rounded-lg border w-full border-white/10">
          <h3 className="text-lg md:text-xl font-bold text-white border-b border-white/20 pb-2">Dates & Ownership</h3>
          
          <div className="space-y-2">
            <Label className="text-white text-sm font-medium">Selling Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all",
                    !formData.sellingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sellingDate ? format(formData.sellingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 backdrop-blur-md bg-white/10 border border-white/20">
                <Calendar
                  mode="single"
                  selected={formData.sellingDate}
                  onSelect={(date) => date && setFormData({ ...formData, sellingDate: date })}
                  initialFocus
                  className="bg-transparent"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-white text-sm font-medium">Payment Receiving Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all",
                    !formData.paymentReceivingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.paymentReceivingDate ? format(formData.paymentReceivingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 backdrop-blur-md bg-white/10 border border-white/20">
                <Calendar
                  mode="single"
                  selected={formData.paymentReceivingDate}
                  onSelect={(date) => date && setFormData({ ...formData, paymentReceivingDate: date })}
                  initialFocus
                  className="bg-transparent"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stoneOwner" className="text-white text-sm font-medium">Stone Ownership</Label>
            <Select
              value={formData.stoneOwner}
              onValueChange={(value: "me" | "others") => setFormData({ ...formData, stoneOwner: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-white/10 border border-white/20 text-white">
                <SelectItem value="me" className="hover:bg-white/20">My Stone</SelectItem>
                <SelectItem value="others" className="hover:bg-white/20">Borrowed Stone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.stoneOwner === "others" && (
            <div className="space-y-2">
              <Label htmlFor="ownerName" className="text-white text-sm font-medium">Owner Name</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
                placeholder="Enter owner's name"
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Buyer Details */}
      <div className="space-y-4 p-4 md:p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg md:text-xl font-bold text-white border-b border-white/20 pb-2">Buyer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="buyerType" className="text-white text-sm font-medium">Buyer Type</Label>
            <Select
              value={formData.buyerType}
              onValueChange={(value: "local" | "chinese") => setFormData({ ...formData, buyerType: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white hover:bg-white/20 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-md bg-white/10 border border-white/20 text-white">
                <SelectItem value="local" className="hover:bg-white/20">Local Person</SelectItem>
                <SelectItem value="chinese" className="hover:bg-white/20">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.buyerType === "local" && (
            <div className="space-y-2">
              <Label htmlFor="buyerName" className="text-white text-sm font-medium">Buyer Name</Label>
              <Input
                id="buyerName"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 transition-all"
                placeholder="Enter buyer's name"
              />
            </div>
          )}
        </div>
      </div>

      {/* Receipt Upload */}
      <div className="space-y-4 p-4 md:p-6 backdrop-blur-sm bg-white/5 rounded-lg border border-white/10">
        <h3 className="text-lg md:text-xl font-bold text-white border-b border-white/20 pb-2">Receipt Image (Optional)</h3>
        <div className="border-2 border-dashed border-white/20 rounded-lg p-4 md:p-6 text-center hover:border-white/40 transition-all duration-300">
          {receiptImage ? (
            <div className="space-y-4">
              <img
                src={receiptImage}
                alt="Receipt"
                className="max-w-xs mx-auto rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                onClick={removeReceipt}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Receipt
              </Button>
            </div>
          ) : (
            <label htmlFor="receipt-upload" className="cursor-pointer">
              {uploadingReceipt ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mb-2"></div>
                  <p className="text-white/60">Uploading receipt...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-white/60" />
                  <p className="text-white/60">Click to upload receipt or drag and drop</p>
                  <p className="text-sm text-white/40">Supports: JPG, PNG, GIF</p>
                </>
              )}
            </label>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleReceiptUpload(e.target.files)}
            className="hidden"
            id="receipt-upload"
            disabled={uploadingReceipt}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/10">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel} 
          className="border-white/20 text-white hover:bg-white/10 focus:ring-2 focus:ring-blue-500/50 transition-all"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/50 transition-all shadow-lg"
        >
          Add Remainder
        </Button>
      </div>
    </form>
  );
}

// Edit Remainder Form Component
function EditRemainderForm({ 
  remainder, 
  onSubmit, 
  onCancel 
}: { 
  remainder: Remainder; 
  onSubmit: (data: Partial<Remainder>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<Partial<Remainder>>({
    stoneName: remainder.stoneName,
    stoneWeight: remainder.stoneWeight,
    stoneCost: remainder.stoneCost,
    sellingPrice: remainder.sellingPrice,
    myProfit: remainder.myProfit || 0,
    partyReceives: remainder.partyReceives || 0,
    sellingDate: remainder.sellingDate,
    paymentReceivingDate: remainder.paymentReceivingDate,
    stoneOwner: remainder.stoneOwner,
    ownerName: remainder.ownerName,
    buyerType: remainder.buyerType,
    buyerName: remainder.buyerName,
  });
  const [receiptImage, setReceiptImage] = useState<string>(remainder.receiptImage || "");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  // Edit form stone autofill states
  const [editStoneIdInput, setEditStoneIdInput] = useState<string>("");
  const [editStoneLoading, setEditStoneLoading] = useState(false);
  const [editStoneFetchError, setEditStoneFetchError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, receiptImage });
  };

  const handleReceiptUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingReceipt(true);
    try {
      const file = files[0];
      const storageRef = ref(storage, `receipts/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setReceiptImage(downloadURL);
    } catch (error) {
      console.error("Error uploading receipt:", error);
    } finally {
      setUploadingReceipt(false);
    }
  };

  const removeReceipt = async () => {
    if (receiptImage && receiptImage !== remainder.receiptImage) {
      try {
        const imageRef = ref(storage, receiptImage);
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting receipt:", error);
      }
    }
    setReceiptImage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stone Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Stone Details</h3>
          
          <div>
            <Label htmlFor="edit-stoneName" className="text-white">Stone Name</Label>
            <Input
              id="edit-stoneName"
              value={formData.stoneName}
              onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
              className={"bg-white/10 border-white/20 text-white " + (editStoneLoading ? 'animate-pulse opacity-80' : '')}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-stoneWeight" className="text-white">Weight (crt)</Label>
            <Input
              id="edit-stoneWeight"
              type="number"
              step="0.01"
              value={formData.stoneWeight}
              onChange={(e) => setFormData({ ...formData, stoneWeight: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-stoneCost" className="text-white">Stone Cost (LKR)</Label>
            <Input
              id="edit-stoneCost"
              type="number"
              step="0.01"
              value={formData.stoneCost}
              onChange={(e) => setFormData({ ...formData, stoneCost: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-sellingPrice" className="text-white">Selling Price (LKR)</Label>
            <Input
              id="edit-sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-myProfit" className="text-white">My Profit (LKR)</Label>
            <Input
              id="edit-myProfit"
              type="number"
              step="0.01"
              value={formData.myProfit}
              onChange={(e) => setFormData({ ...formData, myProfit: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-partyReceives" className="text-white">Party Receives (LKR)</Label>
            <Input
              id="edit-partyReceives"
              type="number"
              step="0.01"
              value={formData.partyReceives}
              onChange={(e) => setFormData({ ...formData, partyReceives: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>
        </div>

        {/* Dates and Ownership */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Dates & Ownership</h3>
          
          <div>
            <Label className="text-white">Selling Date</Label>
            {/* Edit form: My Stone ID loader when owner is 'me' */}
            {remainder.stoneOwner === 'me' && (
              <div className="mt-3">
                <Label htmlFor="edit-stoneId" className="text-white text-sm">My Stone ID (optional)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="edit-stoneId"
                    value={editStoneIdInput}
                    onChange={(e) => setEditStoneIdInput(e.target.value)}
                    placeholder="Enter stone doc ID or custom ID"
                    className="bg-white/10 border-white/20 text-white"
                  />
                  <Button
                    type="button"
                    onClick={async () => {
                      if (!editStoneIdInput) return;
                      setEditStoneLoading(true);
                      setEditStoneFetchError(null);
                      try {
                        const docRef = doc(db, 'stones', editStoneIdInput);
                        const snap = await getDoc(docRef);
                        if (snap.exists()) {
                          const data: any = snap.data();
                          setFormData({
                            ...formData,
                            stoneName: data.name || data.stoneName || formData.stoneName,
                            stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                            stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                          });
                          setEditStoneLoading(false);
                          return;
                        }

                        const q1 = query(collection(db, 'stones'), where('customId', '==', editStoneIdInput), limit(1));
                        const res1 = await getDocs(q1);
                        if (!res1.empty) {
                          const data = res1.docs[0].data() as any;
                          setFormData({
                            ...formData,
                            stoneName: data.name || data.stoneName || formData.stoneName,
                            stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                            stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                          });
                          setEditStoneLoading(false);
                          return;
                        }

                        const num = Number(editStoneIdInput);
                        if (!Number.isNaN(num)) {
                          const q2 = query(collection(db, 'stones'), where('customIdNum', '==', num), limit(1));
                          const res2 = await getDocs(q2);
                          if (!res2.empty) {
                            const data = res2.docs[0].data() as any;
                            setFormData({
                              ...formData,
                              stoneName: data.name || data.stoneName || formData.stoneName,
                              stoneWeight: data.weight || data.weightInRough || formData.stoneWeight,
                              stoneCost: data.stoneCost || data.purchasePrice || formData.stoneCost,
                            });
                            setEditStoneLoading(false);
                            return;
                          }
                        }

                        setEditStoneFetchError('Stone not found for provided ID');
                      } catch (err) {
                        console.error('Error fetching stone:', err);
                        setEditStoneFetchError('Failed to fetch stone');
                      } finally {
                        setEditStoneLoading(false);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editStoneLoading ? 'Loading...' : 'Load'}
                  </Button>
                </div>
                {editStoneFetchError && <p className="text-sm text-red-400 mt-1">{editStoneFetchError}</p>}
              </div>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white",
                    !formData.sellingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.sellingDate ? format(formData.sellingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.sellingDate}
                  onSelect={(date) => date && setFormData({ ...formData, sellingDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-white">Payment Receiving Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white",
                    !formData.paymentReceivingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.paymentReceivingDate ? format(formData.paymentReceivingDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.paymentReceivingDate}
                  onSelect={(date) => date && setFormData({ ...formData, paymentReceivingDate: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="edit-stoneOwner" className="text-white">Stone Ownership</Label>
            <Select
              value={formData.stoneOwner}
              onValueChange={(value: "me" | "others") => setFormData({ ...formData, stoneOwner: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20 text-white">
                <SelectItem value="me">My Stone</SelectItem>
                <SelectItem value="others">Borrowed Stone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.stoneOwner === "others" && (
            <div>
              <Label htmlFor="edit-ownerName" className="text-white">Owner Name</Label>
              <Input
                id="edit-ownerName"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter owner's name"
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Buyer Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Buyer Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-buyerType" className="text-white">Buyer Type</Label>
            <Select
              value={formData.buyerType}
              onValueChange={(value: "local" | "chinese") => setFormData({ ...formData, buyerType: value })}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/10 border-white/20 text-white">
                <SelectItem value="local">Local Person</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.buyerType === "local" && (
            <div>
              <Label htmlFor="edit-buyerName" className="text-white">Buyer Name</Label>
              <Input
                id="edit-buyerName"
                value={formData.buyerName}
                onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="Enter buyer's name"
              />
            </div>
          )}
        </div>
      </div>

      {/* Receipt Upload */}
      <div className="space-y-4">
        <Label className="text-white">Receipt Image (Optional)</Label>
        <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-white/40 transition-colors">
          {receiptImage ? (
            <div className="space-y-4">
              <img
                src={receiptImage}
                alt="Receipt"
                className="max-w-xs mx-auto rounded-lg"
              />
              <Button
                type="button"
                variant="outline"
                onClick={removeReceipt}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <X className="h-4 w-4 mr-2" />
                Remove Receipt
              </Button>
            </div>
          ) : (
            <label htmlFor="edit-receipt-upload" className="cursor-pointer">
              {uploadingReceipt ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60 mb-2"></div>
                  <p className="text-white/60">Uploading receipt...</p>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-white/60" />
                  <p className="text-white/60">Click to upload receipt or drag and drop</p>
                  <p className="text-sm text-white/40">Supports: JPG, PNG, GIF</p>
                </>
              )}
            </label>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleReceiptUpload(e.target.files)}
            className="hidden"
            id="edit-receipt-upload"
            disabled={uploadingReceipt}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-white">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Update Remainder
        </Button>
      </div>
    </form>
  );
}
