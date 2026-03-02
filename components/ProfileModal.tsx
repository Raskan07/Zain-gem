"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Loader2, Check, User } from "lucide-react";
import gsap from "gsap";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch current profile
      const fetchProfile = async () => {
        const docRef = doc(db, "profiles", "user-id-placeholder");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || "");
          setPreviewUrl(data.photoURL || null);
        }
      };
      fetchProfile();

      // GSAP Entry Animation
      const tl = gsap.timeline();
      tl.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" })
        .to(modalRef.current, { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration: 0.4, 
          ease: "power3.out" 
        }, "-=0.2");
    }
  }, [isOpen]);

  const handleClose = () => {
    const tl = gsap.timeline({
      onComplete: onClose
    });
    tl.to(modalRef.current, { 
      opacity: 0, 
      y: 20, 
      scale: 0.95, 
      duration: 0.3, 
      ease: "power2.in" 
    })
    .to(overlayRef.current, { opacity: 0, duration: 0.2 }, "-=0.1");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log("Saving profile for user-id-placeholder...", { name });
    try {
      let photoURL = previewUrl;

      if (image) {
        const storageRef = ref(storage, `profile_pictures/user-id-placeholder-${Date.now()}`);
        await uploadBytes(storageRef, image);
        photoURL = await getDownloadURL(storageRef);
      }

      const profileDoc = doc(db, "profiles", "user-id-placeholder");
      await setDoc(profileDoc, {
        name,
        photoURL,
        updatedAt: new Date(),
      }, { merge: true });
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        handleClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0"
        onClick={handleClose}
      />
      <div 
        ref={modalRef}
        className="relative w-full max-w-sm bg-card backdrop-blur-3xl rounded-[48px] shadow-[0_32px_128px_-32px_rgba(0,0,0,0.8)] overflow-hidden opacity-0 translate-y-10 scale-95 border border-white/5"
      >
        <div className="p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-xl font-bold text-foreground">Edit Profile</h2>
            <button 
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-10">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-secondary border-2 border-white shadow-inner">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-foreground/10 text-foreground rounded-full opacity-0 group-hover:opacity-100 backdrop-blur-sm transition-opacity cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
              <p className="mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">Profile Photo</p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-4">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name" 
                className="w-full px-8 py-5 rounded-[24px] bg-secondary border-none focus:ring-1 focus:ring-foreground/5 text-foreground font-semibold transition-all placeholder:text-muted-foreground/30"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading || saved}
              className="w-full py-5 rounded-[24px] bg-primary text-primary-foreground font-bold text-md shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : saved ? (
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  <span>Update Saved</span>
                </div>
              ) : (
                "Save Changes"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
