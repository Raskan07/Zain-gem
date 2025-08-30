"use client";

import { useState, useEffect } from "react";
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
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Interfaces
interface Remainder {
  id: string;
  stoneName: string;
  stoneWeight: number;
  stoneCost: number;
  sellingPrice: number;
  sellingDate: Date;
  paymentReceivingDate: Date;
  durationInDays: number;
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
  sellingDate: Date;
  paymentReceivingDate: Date;
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
}

export default function RemaindersPage() {
  const [remainders, setRemainders] = useState<Remainder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRemainder, setEditingRemainder] = useState<Remainder | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

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
      const durationInDays = differenceInDays(data.paymentReceivingDate, data.sellingDate);
      const status = durationInDays < 0 ? "overdue" : "pending";
      
      await addDoc(collection(db, "remainders"), {
        ...data,
        durationInDays,
        status,
        receiptImage: data.receiptImage || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding remainder:", error);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Remainders System</h1>
          <p className="text-white/60">Track stone sales and payment schedules</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Remainder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Remainder</DialogTitle>
            </DialogHeader>
            <AddRemainderForm onSubmit={handleAddRemainder} onCancel={() => setShowAddForm(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {remainders.filter(r => r.status === "pending").length}
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {remainders.filter(r => r.status === "overdue").length}
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-white/10 border-white/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-400">
              ₹{remainders.reduce((sum, r) => sum + r.sellingPrice, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Remainders Table */}
      <Card className="backdrop-blur-sm bg-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white">All Remainders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/20">
                <TableHead className="text-white">Stone Details</TableHead>
                <TableHead className="text-white">Dates</TableHead>
                <TableHead className="text-white">Duration</TableHead>
                <TableHead className="text-white">Ownership</TableHead>
                <TableHead className="text-white">Buyer</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Receipt</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {remainders.map((remainder) => (
                <TableRow key={remainder.id} className="border-white/20">
                  <TableCell className="text-white">
                    <div>
                      <p className="font-medium">{remainder.stoneName}</p>
                      <p className="text-sm text-white/60">
                        Weight: {remainder.stoneWeight}g | Cost: ₹{remainder.stoneCost}
                      </p>
                      <p className="text-sm text-white/60">
                        Selling Price: ₹{remainder.sellingPrice}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="text-sm">
                      <p>Sold: {format(remainder.sellingDate, "dd/MM/yyyy")}</p>
                      <p>Payment: {format(remainder.paymentReceivingDate, "dd/MM/yyyy")}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="text-center">
                      <p className={`font-bold ${remainder.durationInDays < 0 ? 'text-red-400' : 'text-white'}`}>
                        {remainder.durationInDays < 0 ? 
                          `${Math.abs(remainder.durationInDays)} days overdue` : 
                          `${remainder.durationInDays} days`
                        }
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div>
                      <p className="font-medium">{remainder.stoneOwner === "me" ? "My Stone" : "Borrowed"}</p>
                      {remainder.ownerName && (
                        <p className="text-sm text-white/60">{remainder.ownerName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    <div>
                      <p className="font-medium">{remainder.buyerType === "local" ? "Local" : "Chinese"}</p>
                      {remainder.buyerName && (
                        <p className="text-sm text-white/60">{remainder.buyerName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    {getStatusBadge(remainder.status)}
                  </TableCell>
                  <TableCell className="text-white">
                    {remainder.receiptImage ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReceiptModal(remainder.receiptImage!)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    ) : (
                      <span className="text-white/40 text-sm">No receipt</span>
                    )}
                  </TableCell>
                  <TableCell className="text-white">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingRemainder(remainder)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRemainder(remainder.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      {editingRemainder && (
        <Dialog open={!!editingRemainder} onOpenChange={() => setEditingRemainder(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Remainder</DialogTitle>
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
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt Image</DialogTitle>
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
    </div>
  );
}

// Add Remainder Form Component
function AddRemainderForm({ onSubmit, onCancel }: { 
  onSubmit: (data: NewRemainder & { receiptImage?: string }) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState<NewRemainder>({
    stoneName: "",
    stoneWeight: 0,
    stoneCost: 0,
    sellingPrice: 0,
    sellingDate: new Date(),
    paymentReceivingDate: new Date(),
    stoneOwner: "me",
    ownerName: "",
    buyerType: "local",
    buyerName: "",
  });
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stone Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Stone Details</h3>
          
          <div>
            <Label htmlFor="stoneName" className="text-white">Stone Name</Label>
            <Input
              id="stoneName"
              value={formData.stoneName}
              onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="stoneWeight" className="text-white">Weight (grams)</Label>
            <Input
              id="stoneWeight"
              type="number"
              step="0.01"
              value={formData.stoneWeight}
              onChange={(e) => setFormData({ ...formData, stoneWeight: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="stoneCost" className="text-white">Stone Cost (₹)</Label>
            <Input
              id="stoneCost"
              type="number"
              step="0.01"
              value={formData.stoneCost}
              onChange={(e) => setFormData({ ...formData, stoneCost: parseFloat(e.target.value) || 0 })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="sellingPrice" className="text-white">Selling Price (₹)</Label>
            <Input
              id="sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
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
            <Label htmlFor="stoneOwner" className="text-white">Stone Ownership</Label>
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
              <Label htmlFor="ownerName" className="text-white">Owner Name</Label>
              <Input
                id="ownerName"
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
            <Label htmlFor="buyerType" className="text-white">Buyer Type</Label>
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
              <Label htmlFor="buyerName" className="text-white">Buyer Name</Label>
              <Input
                id="buyerName"
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
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-white/20 text-white">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
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
    sellingDate: remainder.sellingDate,
    paymentReceivingDate: remainder.paymentReceivingDate,
    stoneOwner: remainder.stoneOwner,
    ownerName: remainder.ownerName,
    buyerType: remainder.buyerType,
    buyerName: remainder.buyerName,
  });
  const [receiptImage, setReceiptImage] = useState<string>(remainder.receiptImage || "");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stone Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Stone Details</h3>
          
          <div>
            <Label htmlFor="edit-stoneName" className="text-white">Stone Name</Label>
            <Input
              id="edit-stoneName"
              value={formData.stoneName}
              onChange={(e) => setFormData({ ...formData, stoneName: e.target.value })}
              className="bg-white/10 border-white/20 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-stoneWeight" className="text-white">Weight (grams)</Label>
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
            <Label htmlFor="edit-stoneCost" className="text-white">Stone Cost (₹)</Label>
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
            <Label htmlFor="edit-sellingPrice" className="text-white">Selling Price (₹)</Label>
            <Input
              id="edit-sellingPrice"
              type="number"
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              className="bg-white/20 text-white"
              required
            />
          </div>
        </div>

        {/* Dates and Ownership */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Dates & Ownership</h3>
          
          <div>
            <Label className="text-white">Selling Date</Label>
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
