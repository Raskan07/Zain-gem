"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Eye } from "lucide-react";
import CustomCard from "@/components/sub-componets/CustomCard";

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
  stoneOwner: "me" | "others";
  ownerName?: string;
  buyerType: "local" | "chinese";
  buyerName?: string;
  receiptImage?: string;
  status: "pending" | "paid" | "overdue";
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date;
}

export default function ArchivesPage() {
  const router = useRouter();
  const [archives, setArchives] = useState<Remainder[]>([]);
  const [selected, setSelected] = useState<Remainder | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageToShow, setImageToShow] = useState<string | null>(null);

  const openImage = (url: string | undefined) => {
    if (!url) return;
    setImageToShow(url);
    setImageModalOpen(true);
  };

  useEffect(() => {
    const q = query(collection(db, "archives"), orderBy("archivedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        // Strongly-typed Firestore document shape to avoid `any`
        type ArchiveDocData = {
          stoneName?: string;
          stoneWeight?: number;
          stoneCost?: number;
          sellingPrice?: number;
          myProfit?: number;
          partyReceives?: number;
          sellingDate?: any;
          paymentReceivingDate?: any;
          durationInDays?: number;
          stoneOwner?: "me" | "others";
          ownerName?: string;
          buyerType?: "local" | "chinese";
          buyerName?: string;
          receiptImage?: string;
          status?: "pending" | "paid" | "overdue";
          createdAt?: any;
          updatedAt?: any;
          archivedAt?: any;
        };

        const data = d.data() as ArchiveDocData;
        return {
          id: d.id,
          ...data,
          sellingDate: data.sellingDate?.toDate ? data.sellingDate.toDate() : new Date(String(data.sellingDate)),
          paymentReceivingDate: data.paymentReceivingDate?.toDate ? data.paymentReceivingDate.toDate() : new Date(String(data.paymentReceivingDate)),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(String(data.createdAt)),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(String(data.updatedAt)),
          archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(String(data.archivedAt)) : undefined),
        } as Remainder;
      });
      setArchives(items);
    });

    return () => unsub();
  }, []);

  const openDetailFor = (arc: Remainder) => {
    setSelected(arc);
    setOpenDetail(true);
  };

  const statusColor = (s: Remainder["status"]) => {
    switch (s) {
      case "paid": return "bg-green-600 text-white";
      case "overdue": return "bg-red-600 text-white";
      default: return "bg-yellow-500 text-black";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Archived Remainders</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>Back</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {archives.length === 0 && (
          <p className="text-white/60">No archived items.</p>
        )}
        {archives.map((arc) => (
            <CustomCard
              key={arc.id}
              remainder={arc}
              onDetail={() => openDetailFor(arc)}
              onEdit={undefined}
              onDelete={undefined}
              onArchive={undefined}
              onViewReceipt={() => openImage(arc.receiptImage)}
              getStatusBadge={(s: Remainder['status']) => (
                <Badge className={statusColor(s)}>{s.toUpperCase()}</Badge>
              )}
              calculateDaysRemaining={(date: Date | string) => {
                const today = new Date();
                today.setHours(0,0,0,0);
                const d = new Date(date as any);
                d.setHours(0,0,0,0);
                return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              }}
            />
        ))}
      </div>

      {/* Detail dialog showing ALL requested fields */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl backdrop-blur-xl bg-white/5 border border-white/20 text-white shadow-2xl">
          <DialogHeader className="flex items-center justify-between pb-2">
            <div>
              <DialogTitle className="text-white text-2xl font-bold">{selected?.stoneName || "Detail"}</DialogTitle>
              <p className="text-sm text-white/60 mt-1">{selected?.buyerName ? `${selected.buyerName} • ${selected.buyerType}` : selected?.buyerType}</p>
            </div>
            {selected && <Badge className={statusColor(selected.status)}>{selected.status.toUpperCase()}</Badge>}
          </DialogHeader>

          {selected && (
            <ScrollArea className="h-[60vh] pr-2">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">ID</p>
                    <p>{selected.id.slice(0,8)}..</p>
                  </div>  

                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Stone Owner</p>
                    <p className="text-white font-semibold">{selected.stoneOwner === "me" ? "Mine" : "Others"}</p>
                    <p className="text-white/60 text-sm mt-2">Owner Name</p>
                    <p className="text-white font-medium">{selected.ownerName || "-"}</p>
                  </div>

                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Duration</p>
                    <p className="text-white font-semibold">{selected.durationInDays ?? "-" } days</p>
                    <p className="text-white/60 text-sm mt-2">Status</p>
                    <p className="text-white font-medium">{selected.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Weight</p>
                    <p className="text-white font-semibold">{selected.stoneWeight} crt</p>
                  </div>

                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Selling Price</p>
                    <p className="text-white font-semibold">LKR {selected.sellingPrice.toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Stone Cost</p>
                    <p className="text-white font-semibold">LKR {selected.stoneCost?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">My Profit</p>
                    <p className="text-green-400 font-semibold">LKR {selected.myProfit?.toLocaleString() || "0"}</p>
                    <p className="text-white/60 text-sm mt-2">Party Receives</p>
                    <p className="text-blue-300 font-medium">LKR {selected.partyReceives?.toLocaleString() || "0"}</p>
                  </div>

                  <div className="p-4 bg-white/3 rounded-md">
                    <p className="text-white/60 text-sm">Selling Date</p>
                    <p className="text-white font-medium">{format(new Date(selected.sellingDate), "PPP")}</p>
                    <p className="text-white/60 text-sm mt-2">Payment Date</p>
                    <p className="text-white font-medium">{format(new Date(selected.paymentReceivingDate), "PPP")}</p>
                  </div>
                </div>

                {selected.receiptImage && (
                  <div className="p-4 bg-white/3 rounded-md flex justify-center">
                    <img
                      src={selected.receiptImage}
                      alt="Receipt"
                      className="max-w-full max-h-72 object-contain rounded-md cursor-pointer shadow-lg"
                      onClick={() => openImage(selected.receiptImage)}
                    />
                  </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="text-sm text-white/70 space-y-1">
                    <div>Created: <span className="text-white">{format(new Date(selected.createdAt), "PPP p")}</span></div>
                    <div>Updated: <span className="text-white">{format(new Date(selected.updatedAt), "PPP p")}</span></div>
                    <div>Archived: <span className="text-white">{selected.archivedAt ? format(new Date(selected.archivedAt), "PPP p") : "-"}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { navigator.clipboard?.writeText(selected.id); }}>Copy ID</Button>
                    <Button variant="outline" onClick={() => setOpenDetail(false)}>Close</Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Image preview dialog */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl backdrop-blur-2xl bg-black/60 border border-white/10 p-0">
          <div className="w-full p-4 flex justify-end">
            <Button variant="ghost" onClick={() => setImageModalOpen(false)} className="text-white">Close</Button>
          </div>
          {imageToShow && (
            <div className="flex justify-center p-4">
              <img src={imageToShow} alt="Enlarged receipt" className="max-w-full max-h-[75vh] object-contain rounded-md shadow-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 