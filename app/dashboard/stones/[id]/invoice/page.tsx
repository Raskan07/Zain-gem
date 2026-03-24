"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Printer, Save, Check, CheckCircle2, PenLine, RefreshCw } from "lucide-react";
import { logActivity } from "@/lib/logger";
import SignaturePadModal from "@/components/SignaturePadModal";

interface StoneInvoice {
  title: string;
  phoneNumbers: string;
  issuingDate: string;
  receiptNumber: string;
  clientName: string;
  clientPhone: string;
  stoneName: string;
  heated: boolean;
  natural: boolean;
  crt: number;
  amount: number;
  total: number;
  boughtPrice?: number;
  paymentDone?: boolean;
  sellerSignatureUrl?: string;
  clientSignatureUrl?: string;
}

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { id } = unwrappedParams;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState("");
  const [stoneData, setStoneData] = useState<any>(null);
  const [openSigModal, setOpenSigModal] = useState<"seller" | "client" | null>(null);
  const [invoice, setInvoice] = useState<StoneInvoice>({
    title: "ZAIN GEM",
    phoneNumbers: "075 2362048 / 077 9441452",
    issuingDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '.'),
    receiptNumber: "",
    clientName: "",
    clientPhone: "",
    stoneName: "",
    heated: false,
    natural: true,
    crt: 0,
    amount: 0,
    total: 0,
    boughtPrice: 0,
    paymentDone: false
  });

  useEffect(() => {
    const fetchStoneAndInvoice = async () => {
      try {
        const docRef = doc(db, "stones", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoneData(data);
          
          const stoneDuration = data.duration || "";
          setDuration(stoneDuration);

          if (data.invoice) {
            setInvoice(prev => ({
              ...prev,
              ...data.invoice,
              title: data.invoice.title || "ZAIN GEM", // Apply Zain Gem default if old
            }));
          } else {
            // Default populate from stone
            const isNatural = data.treatment === "Natural";
            setInvoice(prev => ({
              ...prev,
              receiptNumber: data.customId || "001",
              stoneName: data.name || "",
              natural: isNatural,
              heated: !isNatural,
              crt: data.weight || 0,
              amount: data.totalCost || data.stoneCost || 0,
              total: data.totalCost || data.stoneCost || 0,
              boughtPrice: data.totalCost || data.stoneCost || 0
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching stone for invoice:", error);
      } finally {
        setLoading(false);
      }
    };   
    fetchStoneAndInvoice();
  }, [id]);

  const hasDuration = duration && duration.trim() !== "0";

  const handleSave = async (markAsPaid = false) => {
    setSaving(true);
    try {
      const docRef = doc(db, "stones", id);
      const updatedInvoice = { ...invoice };
      
      if (markAsPaid) {
        updatedInvoice.paymentDone = true;
      }
      
      await updateDoc(docRef, { invoice: updatedInvoice });
      setInvoice(updatedInvoice);
      await logActivity(`Updated e-invoice for stone (${id})`);

      // If duration is provided, store in entries collection
      if (hasDuration) {
        await addDoc(collection(db, "entries"), {
          stoneId: id,
          invoice: updatedInvoice,
          duration,
          createdAt: new Date(),
          type: "duration_sale",
          status: updatedInvoice.paymentDone ? "paid" : "pending",
          stoneCost: invoice.boughtPrice || stoneData?.totalCost || stoneData?.stoneCost || 0,
          sellingPrice: updatedInvoice.total || 0,
        });
        await logActivity(`Logged duration entry for stone (${id})`);
      }

      alert(markAsPaid ? "Payment marked as done and saved to entries!" : "Invoice saved successfully!");
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const rows = [1, 2, 3, 4, 5].map((n, idx) => `
      <tr>
        <td class="num">${n}</td>
        <td class="desc">${idx === 0 ? (invoice.stoneName || '') : ''}</td>
        <td class="center">${idx === 0 && invoice.natural ? '&#10003;' : ''}</td>
        <td class="center">${idx === 0 && invoice.heated ? '&#10003;' : ''}</td>
        <td class="center">${idx === 0 && invoice.crt > 0 ? invoice.crt : ''}</td>
        <td class="amount">${idx === 0 && invoice.amount > 0 ? invoice.amount.toLocaleString() : ''}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt #${invoice.receiptNumber || '001'}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 10mm 12mm;
      font-family: 'Times New Roman', Times, serif;
      background: #fff;
      color: #000;
    }
    /* Header */
    .header-box { border: 1.5px solid #000; padding: 8px; margin-bottom: 18px; }
    .brand-title { text-align: center; font-size: 42px; font-weight: 900; letter-spacing: 3px; color: #A66F18; margin-bottom: 2px; }
    .brand-sub   { text-align: center; font-size: 17px; font-weight: 700; text-transform: uppercase; color: #1f2937; }
    .brand-phones{ text-align: center; font-size: 12px; color: #1d4ed8; margin-top: 4px; }
    .brand-phones span { margin: 0 8px; }
    /* Client grid */
    .client-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; padding: 0 8px 6px; }
    .field-row       { display: flex; align-items: flex-end; gap: 8px; }
    .field-row-right { display: flex; align-items: flex-end; gap: 8px; justify-content: flex-end; }
    .field-label { font-size: 15px; font-weight: 700; white-space: nowrap; }
    .field-value { flex: 1; border-bottom: 1px solid #000; height: 24px; padding-left: 4px; font-size: 13px; font-weight: 600; display: flex; align-items: flex-end; overflow: hidden; }
    .field-value-fixed { width: 150px; border-bottom: 1px solid #000; height: 24px; padding-right: 4px; font-size: 13px; font-weight: 600; display: flex; align-items: flex-end; justify-content: flex-end; }
    /* Table */
    .table-wrapper { position: relative; }
    table { width: 100%; border-collapse: collapse; border: 1.5px solid #000; table-layout: fixed; }
    colgroup col:nth-child(1) { width: 8%  }
    colgroup col:nth-child(2) { width: 36% }
    colgroup col:nth-child(3) { width: 12% }
    colgroup col:nth-child(4) { width: 12% }
    colgroup col:nth-child(5) { width: 12% }
    colgroup col:nth-child(6) { width: 20% }
    thead tr {
      background: linear-gradient(to right, #DD6858, #BA730E) !important;
      color: #fff !important;
    }
    th { border-right: 1px solid rgba(0,0,0,0.25); padding: 10px 4px; font-size: 13px; font-weight: 700; text-align: center; color: #fff; }
    th:last-child { border-right: none; }
    tbody tr { border-top: 1px solid #000; }
    td { border-right: 1px solid rgba(0,0,0,0.25); padding: 11px 4px; font-size: 12px; font-weight: 900; color: #000; vertical-align: middle; }
    td:last-child { border-right: none; }
    td.num    { text-align: center; background: rgba(255,255,255,0.5); }
    td.desc   { text-align: left;   padding-left: 8px; text-transform: uppercase; word-break: break-word; }
    td.center { text-align: center; }
    td.amount { text-align: right;  padding-right: 8px; background: rgba(255,255,255,0.5); }
    /* Total */
    .total-row { display: flex; margin-top: 18px; align-items: center; }
    .total-label { flex: 1; text-align: right; padding-right: 16px; font-size: 32px; font-weight: 900; }
    .total-box { width: 20%; min-width: 120px; border: 1.5px solid #000; height: 64px; display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; font-size: 24px; font-weight: 900; background: #fff; }
    /* Footer */
    .footer { margin-top: 48px; }
    .sig-row { display: flex; justify-content: space-between; padding: 0 8px; }
    .sig { width: 36%; }
    .sig-right { width: 36%; text-align: right; }
    .sig-line { border-bottom: 1px solid #000; height: 60px; margin-bottom: 6px; position: relative; overflow: hidden; }
    .sig-label { font-size: 14px; font-weight: 700; }
    .receipt-num { text-align: right; margin-top: 14px; font-size: 11px; font-weight: 700; font-family: monospace; }
  </style>
</head>
<body>
  <div class="header-box">
    <div class="brand-title">ZAIN'S GEM</div>
    <div class="brand-sub">Ceylon (PVT) LTD</div>
    <div class="brand-phones"><span>0779311741</span><span>0774039007</span></div>
    <div class="client-grid">
      <div class="field-row">
        <span class="field-label">Name</span>
        <div class="field-value">${invoice.clientName || ''}</div>
      </div>
      <div class="field-row-right">
        <span class="field-label">Date</span>
        <div class="field-value-fixed">${invoice.issuingDate || ''}</div>
      </div>
      <div class="field-row">
        <div style="flex:1;height:24px;border-bottom:1px solid transparent;"></div>
      </div>
      <div class="field-row-right">
        <span class="field-label">Phone</span>
        <div class="field-value-fixed">${invoice.clientPhone || ''}</div>
      </div>
    </div>
  </div>

  <div class="table-wrapper">
    <table>
      <colgroup><col><col><col><col><col><col></colgroup>
      <thead>
        <tr>
          <th>No</th><th>Description</th><th>Natural</th><th>Heated</th><th>crt</th><th>Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="total-row">
    <div class="total-label">Total</div>
    <div class="total-box">${invoice.total.toLocaleString()}</div>
  </div>

  <div class="footer">
    <div class="sig-row">
      <div class="sig">
        <div class="sig-line" style="position:relative;overflow:hidden;">
          ${invoice.sellerSignatureUrl
            ? `<img src="${invoice.sellerSignatureUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" />`
            : ''}
        </div>
        <span class="sig-label">Signature</span>
      </div>
      <div class="sig-right">
        <div class="sig-line" style="position:relative;overflow:hidden;">
          ${invoice.clientSignatureUrl
            ? `<img src="${invoice.clientSignatureUrl}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;" />`
            : ''}
        </div>
        <span class="sig-label">Signature (Client)</span>
      </div>
    </div>
    <div class="receipt-num">#${invoice.receiptNumber || '001'}</div>
  </div>
</body>
</html>`;


    const win = window.open('', '_blank', 'width=900,height=1200');
    if (!win) {
      alert('Please allow popups for this site to enable printing.');
      return;
    }
    win.document.write(html);
    win.document.close();

    // Preload all signature images before triggering print
    const sigUrls = [
      invoice.sellerSignatureUrl,
      invoice.clientSignatureUrl,
    ].filter(Boolean) as string[];

    const preloadImages = (urls: string[]): Promise<void[]> =>
      Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve(); // don't block if one fails
              img.src = url;
            })
        )
      );

    const triggerPrint = () => {
      if (!win.closed) {
        win.focus();
        win.print();
        // Don't auto-close so user can see the print dialog
      }
    };

    if (sigUrls.length > 0) {
      // Wait for signatures to be preloaded in the popup's context too
      preloadImages(sigUrls).then(() => {
        setTimeout(triggerPrint, 300);
      });
    } else {
      win.onload = triggerPrint;
      setTimeout(triggerPrint, 600); // fallback
    }
  };

  const handleSignatureSaved = async (type: "seller" | "client", url: string) => {
    const field = type === "seller" ? "sellerSignatureUrl" : "clientSignatureUrl";
    const updated = { ...invoice, [field]: url };
    setInvoice(updated);
    setOpenSigModal(null);
    try {
      const docRef = doc(db, "stones", id);
      await updateDoc(docRef, { invoice: updated });
      await logActivity(`Saved ${type} signature for stone (${id})`);
    } catch (e) {
      console.error("Failed to persist signature URL:", e);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64 text-white">Loading invoice...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4 print:hidden">
        <div>
          <Button variant="ghost" className="text-white/60 hover:text-white mb-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Stones
          </Button>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-indigo-300 bg-clip-text text-transparent tracking-tight mb-2">E-Invoice Editor</h1>
          <p className="text-white/60 text-lg font-medium">Customize and print modern receipt</p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="backdrop-blur-3xl bg-blue-600/20 border-blue-500/50 border text-blue-100 hover:bg-blue-600/40 px-6 py-6 rounded-2xl shadow-xl transition-all duration-300 font-bold"
          >
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save Invoice"}
          </Button>
          <Button 
            onClick={handlePrint}
            className="backdrop-blur-3xl bg-white/10 border-white/10 border text-white hover:bg-white/20 px-6 py-6 rounded-2xl shadow-xl transition-all duration-300 font-bold"
          >
            <Printer className="h-5 w-5 mr-2" />
            Print / PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 print:block print:w-full w-full print:m-0 print:p-0">
        {/* Editor Controls - Hidden on Print */}
        <Card className="backdrop-blur-3xl bg-slate-900/60 border-white/10 shadow-2xl rounded-[2.5rem] w-full print:hidden">
          <CardHeader className="p-6 md:p-8 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-white">Invoice Details</CardTitle>
            {hasDuration && !invoice.paymentDone && (
              <Button 
                onClick={() => handleSave(true)}
                className="bg-green-500 hover:bg-green-600 text-white border-none rounded-xl font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)]"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Payment Done
              </Button>
            )}
            {hasDuration && invoice.paymentDone && (
              <span className="text-green-400 font-bold flex items-center bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Payment Completed
              </span>
            )}
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-white">Business Title</Label>
                <Input id="title" value={invoice.title} onChange={e => setInvoice({...invoice, title: e.target.value})} className="bg-white/5 border-white/10 text-white font-semibold" />
              </div>
              <div>
                <Label htmlFor="phoneNumbers" className="text-white">Business Phones</Label>
                <Input id="phoneNumbers" value={invoice.phoneNumbers} onChange={e => setInvoice({...invoice, phoneNumbers: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label htmlFor="issuingDate" className="text-white">Date</Label>
                <Input id="issuingDate" value={invoice.issuingDate} onChange={e => setInvoice({...invoice, issuingDate: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label htmlFor="receiptNumber" className="text-white">Receipt Number</Label>
                <Input id="receiptNumber" value={invoice.receiptNumber} onChange={e => setInvoice({...invoice, receiptNumber: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName" className="text-white">Client Name</Label>
                <Input id="clientName" value={invoice.clientName} onChange={e => setInvoice({...invoice, clientName: e.target.value})} className="bg-white/5 border-white/10 text-white font-medium" />
              </div>
              <div>
                <Label htmlFor="clientPhone" className="text-white">Client Tel / Phone</Label>
                <Input id="clientPhone" value={invoice.clientPhone} onChange={e => setInvoice({...invoice, clientPhone: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-4">
              <div>
                <Label htmlFor="stoneName" className="text-white">Stone Name / Description</Label>
                <Input id="stoneName" value={invoice.stoneName} onChange={e => setInvoice({...invoice, stoneName: e.target.value})} className="bg-white/5 border-white/10 text-white" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col gap-2">
                  <Label className="text-white">Heated</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInvoice({...invoice, heated: !invoice.heated})}
                    className={`h-10 border-white/10 text-white ${invoice.heated ? 'bg-blue-600/50' : 'bg-white/5'}`}
                  >
                    {invoice.heated && <Check className="h-4 w-4 mr-2" />} Yes
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-white">Natural</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setInvoice({...invoice, natural: !invoice.natural})}
                    className={`h-10 border-white/10 text-white ${invoice.natural ? 'bg-blue-600/50' : 'bg-white/5'}`}
                  >
                    {invoice.natural && <Check className="h-4 w-4 mr-2" />} Yes
                  </Button>
                </div>
                <div>
                  <Label htmlFor="crt" className="text-white">Crt (Carat)</Label>
                  <Input id="crt" type="number" step="0.01" value={invoice.crt} onChange={e => setInvoice({...invoice, crt: parseFloat(e.target.value) || 0})} className="bg-white/5 border-white/10 text-white font-mono" />
                </div>
                <div>
                  <Label htmlFor="amount" className="text-white">Amount</Label>
                  <Input id="amount" type="number" value={invoice.amount} onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    setInvoice({...invoice, amount: val, total: val}); // Auto sync total
                  }} className="bg-white/5 border-white/10 text-white font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boughtPrice" className="text-white font-medium text-slate-400">Bought Price (Optional)</Label>
                  <Input id="boughtPrice" type="number" value={invoice.boughtPrice} onChange={e => setInvoice({...invoice, boughtPrice: parseFloat(e.target.value) || 0})} className="bg-white/5 border-white/10 text-white font-mono h-14" placeholder="Cost..." />
                </div>
                <div>
                  <Label htmlFor="total" className="text-white font-bold">Total (Override)</Label>
                  <Input id="total" type="number" value={invoice.total} onChange={e => setInvoice({...invoice, total: parseFloat(e.target.value) || 0})} className="bg-white/5 border-white/10 text-white font-mono font-bold text-lg h-14" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pixel-Perfect Print Preview */}
        {/* Scroll wrapper: prevents the receipt from crushing when in the side-by-side editor layout */}
        <div className="overflow-x-auto w-full print:overflow-visible">
        <div 
          className="print-area bg-white mx-auto text-black relative print:shadow-none print:max-w-none print:m-0 print:p-0 border border-slate-200 shadow-xl"
          style={{ 
            minWidth: '340px',
            width: '100%',
            maxWidth: '800px',
            fontFamily: "'Times New Roman', Times, serif",
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          } as any}
        >
          {/* Main Container */}
          <div className="relative w-full flex flex-col p-5 print:p-[10mm]">
            
            {/* Header Box */}
            <div className="border-[1.5px] border-black p-2 mb-4 bg-white">
              <div className="text-center mb-3">
                <h1 className="text-4xl font-bold tracking-wider mb-1" style={{ color: '#A66F18' }}>ZAIN'S GEM</h1>
                <p className="text-base font-bold text-gray-800 uppercase">Ceylon (PVT) LTD</p>
                <div className="text-[12px] flex justify-center gap-4 mt-1" style={{ color: '#1d4ed8' }}>
                  <span>0779311741</span>
                  <span>0774039007</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-3 mt-4 px-3 pb-2">
                <div className="flex items-end gap-2">
                  <span className="text-sm font-bold whitespace-nowrap">Name</span>
                  <div className="flex-1 border-b border-black mb-1 h-6 min-w-0 overflow-hidden">
                    <span className="text-xs font-semibold pl-1 truncate block">{invoice.clientName}</span>
                  </div>
                </div>
                <div className="flex items-end gap-2 justify-end">
                  <span className="text-sm font-bold whitespace-nowrap">Date</span>
                  <div className="w-32 border-b border-black mb-1 h-6 text-right">
                    <span className="text-xs font-semibold pr-1">{invoice.issuingDate}</span>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 border-b border-black mb-1 h-6 invisible" />
                </div>
                <div className="flex items-end gap-2 justify-end">
                  <span className="text-sm font-bold whitespace-nowrap">Phone</span>
                  <div className="w-32 border-b border-black mb-1 h-6 text-right">
                    <span className="text-xs font-semibold pr-1">{invoice.clientPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Area with Watermark */}
            <div className="relative flex-1 bg-transparent">
              {/* Gem Watermark */}
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 opacity-40 pointer-events-none w-[60%] max-w-[400px]">
                <img src="/bg/bg.png" alt="Gem Watermark" className="w-full h-auto object-contain" />
              </div>

              {/* Table - responsive using a real <table> for reliable print rendering */}
              <div className="relative z-10 border-[1.5px] border-black bg-transparent overflow-x-auto">
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '36%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{
                      background: 'linear-gradient(to right, #DD6858, #BA730E)',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                      color: 'white',
                    } as any}>
                      <th className="border-r border-black/30 text-center py-2 text-sm font-bold">No</th>
                      <th className="border-r border-black/30 text-center py-2 text-sm font-bold">Description</th>
                      <th className="border-r border-black/30 text-center py-2 text-[10px] font-bold">Natural</th>
                      <th className="border-r border-black/30 text-center py-2 text-[10px] font-bold">Heated</th>
                      <th className="border-r border-black/30 text-center py-2 text-sm font-bold">crt</th>
                      <th className="text-center py-2 text-sm font-bold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, idx) => (
                      <tr key={idx} className="border-t border-black">
                        <td className="border-r border-black/30 text-center py-3 text-base font-bold bg-white/40">{idx + 1}</td>
                        <td className="border-r border-black/30 px-2 py-3 text-xs font-black text-black uppercase break-words">{idx === 0 ? invoice.stoneName : ""}</td>
                        <td className="border-r border-black/30 text-center py-3 text-sm font-black text-black">{idx === 0 && invoice.natural ? "✓" : ""}</td>
                        <td className="border-r border-black/30 text-center py-3 text-sm font-black text-black">{idx === 0 && invoice.heated ? "✓" : ""}</td>
                        <td className="border-r border-black/30 text-center py-3 text-xs font-black text-black">{idx === 0 && invoice.crt > 0 ? invoice.crt : ""}</td>
                        <td className="text-right px-2 py-3 text-xs font-black text-black bg-white/40">{idx === 0 && invoice.amount > 0 ? invoice.amount.toLocaleString() : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Section */}
              <div className="flex mt-4">
                <div className="flex-1 flex items-center justify-end pr-4 text-3xl font-black text-black">Total</div>
                <div className="border-[1.5px] border-black h-16 bg-white flex items-center justify-end px-3 text-2xl font-black text-black" style={{ width: '20%', minWidth: '110px' }}>
                  {invoice.total.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Footer - Interactive Signature Areas */}
            <div className="mt-8">
              <div className="flex justify-between items-end px-2 mb-2 gap-2">
                {/* Seller Signature */}
                <div className="flex flex-col items-start gap-1" style={{ width: '42%' }}>
                  <button
                    onClick={() => setOpenSigModal("seller")}
                    className="w-full h-16 border-b-2 border-black relative group overflow-hidden bg-transparent hover:bg-black/5 transition-colors"
                    title="Click to sign"
                  >
                    {invoice.sellerSignatureUrl ? (
                      <>
                        <img
                          src={invoice.sellerSignatureUrl}
                          alt="Seller Signature"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                        <PenLine className="w-4 h-4 text-black mr-1" />
                        <span className="text-xs font-medium text-black">Click to sign</span>
                      </div>
                    )}
                  </button>
                  <span className="text-xs font-bold">Signature</span>
                </div>

                {/* Client Signature */}
                <div className="flex flex-col items-end gap-1" style={{ width: '42%' }}>
                  <button
                    onClick={() => setOpenSigModal("client")}
                    className="w-full h-16 border-b-2 border-black relative group overflow-hidden bg-transparent hover:bg-black/5 transition-colors"
                    title="Click to sign"
                  >
                    {invoice.clientSignatureUrl ? (
                      <>
                        <img
                          src={invoice.clientSignatureUrl}
                          alt="Client Signature"
                          className="absolute inset-0 w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <RefreshCw className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-60 transition-opacity">
                        <PenLine className="w-4 h-4 text-black mr-1" />
                        <span className="text-xs font-medium text-black">Click to sign</span>
                      </div>
                    )}
                  </button>
                  <span className="text-xs font-bold">Signature (Client)</span>
                </div>
              </div>
              <div className="text-right mt-3 pr-2">
                <span className="text-xs font-bold font-mono">#{invoice.receiptNumber || '003'}</span>
              </div>
            </div>


            {/* Paid Stamp */}
            {invoice.paymentDone && (
              <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.08] rotate-[15deg] z-50">
                <div className="border-[15px] border-red-600 rounded-full p-12">
                  <span className="text-9xl font-black text-red-600 uppercase tracking-tighter">PAID</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>{/* end scroll wrapper */}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* 
           * VISIBILITY ISOLATION: hide everything on the page,
           * then selectively show only the receipt.
           * This works in Next.js where display:none chains fail.
           */
          html {
            background: white !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            visibility: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Show only the receipt */
          .print-area {
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            min-width: unset !important;
            max-width: unset !important;
            margin: 0 !important;
            padding: 10mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            overflow: hidden !important;
            font-family: 'Times New Roman', Times, serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Make all children of print-area visible */
          .print-area * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Force gradient header row to print with colors */
          .print-area thead tr {
            background: linear-gradient(to right, #DD6858, #BA730E) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: white !important;
          }

          .print-area thead tr th {
            color: white !important;
          }

          /* Hide the scroll wrapper's scrollbar in print */
          .print\\:overflow-visible {
            overflow: visible !important;
          }
        }
      `}</style>

      {/* Signature Pad Modal */}
      {openSigModal && (
        <SignaturePadModal
          type={openSigModal}
          stoneId={id}
          stoneName={invoice.stoneName}
          onSaved={(url) => handleSignatureSaved(openSigModal, url)}
          onClose={() => setOpenSigModal(null)}
        />
      )}
    </div>
  );
}