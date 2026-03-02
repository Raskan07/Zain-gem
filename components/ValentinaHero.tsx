import React, { useEffect, useRef, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import gsap from "gsap";

const stats = [
  { label: "Interviews", value: "70%", color: "#2D2D2D" },
  { label: "Hired", value: "10%", color: "#FFD700" },
  { label: "Project time", value: "15%", color: "#E0E0E0", dashed: true },
  { label: "Output", value: "5%", color: "#2D2D2D", outline: true },
];

export function ValentinaHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<{ name: string; photoURL: string | null }>({
    name: "Valentina",
    photoURL: null
  });

  useEffect(() => {
    // Listen for profile changes
    const unsub = onSnapshot(doc(db, "profiles", "user-id-placeholder"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile({
          name: data.name || "Valentina",
          photoURL: data.photoURL || null
        });
      }
    });

    if (containerRef.current) {
      gsap.from(containerRef.current.children, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });
    }

    return () => unsub();
  }, []);

  return (
    <div ref={containerRef} className="p-10 pb-6 border-b border-gray-100/50">
      <h1 className="text-5xl font-medium text-foreground mb-10 tracking-tight">
        Hello <span className="text-muted-foreground">{profile.name}</span>
      </h1>

      <div className="flex flex-wrap items-end gap-12">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
            <div className="flex items-center gap-3">
               {stat.outline ? (
                 <div className="relative w-12 h-12 flex items-center justify-center rounded-full border border-gray-200">
                    <span className="text-[10px] font-bold text-foreground">{stat.value}</span>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="24" cy="24" r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="138"
                        strokeDashoffset={138 - (138 * 5) / 100}
                        className="transition-all duration-1000 text-foreground"
                      />
                    </svg>
                 </div>
               ) : stat.dashed ? (
                 <div className="w-24 h-5 rounded-full bg-secondary overflow-hidden relative">
                    <div 
                      className="absolute inset-0 h-full bg-muted-foreground/20" 
                      style={{ 
                        width: stat.value,
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.4) 75%, transparent 75%, transparent)',
                        backgroundSize: '10px 10px'
                      }} 
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">{stat.value}</span>
                 </div>
               ) : (
                <div className="flex items-center gap-2">
                  <div className="w-48 h-6 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ width: stat.value, backgroundColor: stat.color }} 
                    />
                  </div>
                  <span className="text-xs font-bold text-foreground">{stat.value}</span>
                </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
