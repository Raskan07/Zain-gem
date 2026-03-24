"use client";

import React, { useRef, useState, useCallback, ComponentType } from "react";
import dynamic from "next/dynamic";
import type ReactSignatureCanvas from "react-signature-canvas";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { X, RotateCcw, CheckCircle, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

// Dynamically import to avoid SSR issues with canvas
const SignatureCanvas = dynamic(
  () => import("react-signature-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-48 text-white/40">
        Loading canvas…
      </div>
    ),
  }
) as ComponentType<ReactSignatureCanvas["props"] & { ref?: React.RefObject<ReactSignatureCanvas> }>;

interface SignaturePadModalProps {
  /** "seller" | "client" */
  type: "seller" | "client";
  stoneId: string;
  stoneName: string;
  /** Called with the download URL once saved */
  onSaved: (url: string) => void;
  onClose: () => void;
}

export default function SignaturePadModal({
  type,
  stoneId,
  stoneName,
  onSaved,
  onClose,
}: SignaturePadModalProps) {
  const sigRef = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [error, setError] = useState("");

  const handleClear = () => {
    sigRef.current?.clear();
    setIsEmpty(true);
    setError("");
  };

  const handleEnd = () => {
    setIsEmpty(sigRef.current?.isEmpty() ?? true);
  };

  const handleSave = useCallback(async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("Please draw a signature first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      // Export as PNG data URL
      const dataUrl: string = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      // Strip the "data:image/png;base64," prefix for uploadString
      const base64 = dataUrl.split(",")[1];

      const label = type === "seller" ? "seller" : "client";
      const path = `signatures/${stoneId}/${label}_${Date.now()}.png`;
      const storageRef = ref(storage, path);

      await uploadString(storageRef, base64, "base64", {
        contentType: "image/png",
      });
      const url = await getDownloadURL(storageRef);
      onSaved(url);
    } catch (err: any) {
      console.error("Signature upload failed:", err);
      setError("Failed to save signature. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [stoneId, type, onSaved]);

  const label = type === "seller" ? "Seller Signature" : "Client Signature";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg,#DD6858,#BA730E)" }}>
              <PenLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{label}</h2>
              <p className="text-white/40 text-xs">
                {stoneName ? `${stoneName} — ` : ""}Stone #{stoneId.slice(0, 8)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="px-6 pt-5 pb-2">
          <div className="rounded-2xl overflow-hidden border-2 border-dashed border-white/20 bg-white relative"
               style={{ cursor: "crosshair" }}>
            <SignatureCanvas
              ref={sigRef}
                penColor="#0f172a"
              canvasProps={{
                width: 480,
                height: 200,
                className: "w-full h-[200px] touch-none",
                style: { background: "white" },
              }}
              onEnd={handleEnd}
            />
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-slate-300 text-sm font-medium select-none">
                  ✍️ Sign here…
                </span>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-red-400 text-xs">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between px-6 pb-6 pt-4 gap-3">
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={saving}
            className="text-white/60 hover:text-white hover:bg-white/10 gap-2 rounded-xl"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-white/10 text-white/70 hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || isEmpty}
              className="rounded-xl font-bold text-white gap-2 px-6"
              style={{
                background: "linear-gradient(135deg,#DD6858,#BA730E)",
                boxShadow: "0 0 20px rgba(221,104,88,0.35)",
              }}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Save Signature</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
