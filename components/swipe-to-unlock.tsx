"use client";

import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { ChevronRight, Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface SwipeToUnlockProps {
  onUnlock: () => void;
  text?: string;
}

export default function SwipeToUnlock({ onUnlock, text = "Swipe to unlock" }: SwipeToUnlockProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Define the width of the track and the handle
  const trackWidth = 280;
  const handleSize = 56;
  const maxDrag = trackWidth - handleSize - 8; // 8 is for padding

  // Transform x position to opacity and other styles
  const opacity = useTransform(x, [0, maxDrag], [1, 0.1]);
  const bgOpacity = useTransform(x, [0, maxDrag], [0.1, 0.3]);
  const scale = useTransform(x, [0, maxDrag], [1, 1.1]);

  const handleDragEnd = async () => {
    const currentX = x.get();
    if (currentX >= maxDrag * 0.9) {
      setIsUnlocked(true);
      await controls.start({ x: maxDrag, transition: { type: "spring", stiffness: 500, damping: 30 } });
      onUnlock();
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 30 } });
    }
  };

  return (
    <div className="relative w-[300px] h-[72px] bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-full p-2 border border-white/20 flex items-center overflow-hidden">
      {/* Background track text */}
      <motion.div 
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <span className="text-white/50 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
          {text} <ChevronRight className="w-4 h-4 animate-pulse" />
        </span>
      </motion.div>

      {/* The Draggable Handle */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: maxDrag }}
        dragElastic={0.05}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className="relative z-10 w-[56px] h-[56px] bg-gradient-to-br from-[#fcd34d] to-[#eab308] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg shadow-yellow-500/20"
      >
        <Lock className="text-[#0e100f] w-6 h-6" />
      </motion.div>

      {/* Progress fill */}
      <motion.div 
        style={{ width: x, opacity: bgOpacity }}
        className="absolute left-2 top-2 bottom-2 bg-white/20 rounded-full pointer-events-none"
      />
    </div>
  );
}
