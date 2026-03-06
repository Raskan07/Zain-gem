"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function LogoAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !logoRef.current) return;

    const container = containerRef.current;
    const logo = logoRef.current;

    // Set perspective on the container
    gsap.set(container, { perspective: 800 });

    // Create quick setters for smooth performance
    const outerRX = gsap.quickTo(container, "rotationX", { duration: 0.5, ease: "power3.out" });
    const outerRY = gsap.quickTo(container, "rotationY", { duration: 0.5, ease: "power3.out" });
    const innerX = gsap.quickTo(logo, "x", { duration: 0.5, ease: "power3.out" });
    const innerY = gsap.quickTo(logo, "y", { duration: 0.5, ease: "power3.out" });

    const handleMouseMove = (e: PointerEvent) => {
      const { clientX, clientY } = e;
      const { width, height, left, top } = container.getBoundingClientRect();
      
      const xPercent = (clientX - left) / width;
      const yPercent = (clientY - top) / height;

      // Adjust these values to control the intensity of the effect
      outerRX(gsap.utils.interpolate(15, -15, yPercent));
      outerRY(gsap.utils.interpolate(-15, 15, xPercent));
      innerX(gsap.utils.interpolate(-30, 30, xPercent));
      innerY(gsap.utils.interpolate(-30, 30, yPercent));
    };

    const handleMouseLeave = () => {
      outerRX(0);
      outerRY(0);
      innerX(0);
      innerY(0);
    };

    // Attach listener to the window but bound to the container proximity if desired, 
    // or just the container as per sample code.
    container.addEventListener("pointermove", handleMouseMove);
    container.addEventListener("pointerleave", handleMouseLeave);

    return () => {
      container.removeEventListener("pointermove", handleMouseMove);
      container.removeEventListener("pointerleave", handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="logo-outer relative w-[300px] h-[300px] md:w-[450px] md:h-[300px] rounded-[4rem] flex items-center justify-center overflow-hidden transition-shadow duration-500 shadow-2xl hover:shadow-[0_0_80px_rgba(234,179,8,0.4)]"
      style={{
        background: `radial-gradient(100% 100% at 50% 50%, #fcd34d 0%, #eab308 50%, #ca8a04 100%)`,
      }}
    >
      <div 
        ref={logoRef}
        className="logo flex flex-col items-center gap-3 select-none"
      >
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-[#0e100f] italic drop-shadow-sm">
          ZAIN GEMS
        </h2>
        <div className="h-1.5 w-3/4 bg-[#0e100f] rounded-full opacity-10" />
      </div>
      
      {/* Shine effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
