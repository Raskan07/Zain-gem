"use client";

import { useState, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Sun, Moon, Loader2, ArrowLeft } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import LogoAnimation from "@/components/logo-animation";
import SwipeToUnlock from "@/components/swipe-to-unlock";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const [value, setValue] = useState("");
  const [flowState, setFlowState] = useState<"locked" | "passcode" | "authenticated" | "loading">("locked");
  const [showError, setShowError] = useState(false);
  const [profileName, setProfileName] = useState("");
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    // Fetch profile name from Firebase
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "profiles", "user-id-placeholder");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfileName(docSnap.data().name || "Master Gemologist");
        } else {
          setProfileName("Master Gemologist");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfileName("Master Gemologist");
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = () => {
    if (value === "123456") {
      setFlowState("loading");
      setShowError(false);
      
      // Simulate loading time and then redirect
      setTimeout(() => {
        setFlowState("authenticated");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }, 2000);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="dark min-h-screen bg-background selection:bg-primary selection:text-primary-foreground relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Gradients (Matched with Dashboard) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[#eab308]/15 to-transparent blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[#eab308]/10 to-transparent blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="fixed top-4 right-4 z-50 bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 text-white rounded-full"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <AnimatePresence mode="wait">
          {flowState === "locked" && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-12"
            >
              <LogoAnimation />
              <div className="text-center space-y-3">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-5xl md:text-7xl font-bold text-white tracking-widest uppercase italic"
                >
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-yellow-500/60 text-lg md:text-xl font-light tracking-[0.3em] uppercase"
                >
                  Exquisite Brilliance, Redefined.
                </motion.p>
              </div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <SwipeToUnlock onUnlock={() => setFlowState("passcode")} />
              </motion.div>
            </motion.div>
          )}

          {flowState === "passcode" && (
            <motion.div
              key="passcode"
              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              transition={{ duration: 0.6, ease: "circOut" }}
              className="w-full max-w-md"
            >
              <Card className="bg-black/60 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden relative rounded-[3rem]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#eab308]/5 via-transparent to-transparent pointer-events-none" />
                
                <CardHeader className="text-center pb-2 pt-8">
                  <div className="flex justify-start absolute top-6 left-6">
                   <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFlowState("locked")}
                      className="text-white/20 hover:text-white hover:bg-white/5 rounded-full px-4"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                  </div>
                  <CardTitle className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 tracking-tight">
                    Secure Access
                  </CardTitle>
                  <CardDescription className="text-yellow-500/40 uppercase tracking-[0.2em] text-[10px] font-bold mt-2">
                    Enter Gemvault Key
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-10 pb-12 pt-6 px-10">
                  <div className="flex justify-center">
                    <InputOTP
                      value={value}
                      onChange={(val) => setValue(val)}
                      maxLength={6}
                      containerClassName="gap-3"
                    >
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot 
                            key={i}
                            index={i} 
                            className="w-12 h-16 md:w-14 md:h-20 text-2xl font-bold border-none bg-white/5 text-yellow-500 rounded-2xl focus:ring-2 focus:ring-[#eab308] transition-all shadow-inner" 
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <AnimatePresence>
                    {showError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center space-x-2 text-red-400 bg-red-500/5 p-4 rounded-2xl border border-red-500/10"
                      >
                        <XCircle className="h-5 w-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Invalid Key. Access Denied.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6">
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full h-16 text-lg font-black bg-gradient-to-r from-yellow-400 to-yellow-600 text-[#0e100f] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-[2rem] shadow-[0_20px_40px_-10px_rgba(234,179,8,0.3)] disabled:opacity-30 disabled:grayscale uppercase tracking-widest"
                      disabled={value.length !== 6}
                    >
                      Unlock Vault
                    </Button>
                    
                    <p className="text-center text-[10px] text-white/10 font-mono tracking-[0.5em] uppercase">
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {flowState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative w-32 h-32">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-2 border-yellow-500"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border-b-2 border-yellow-500/30"
                />
                <div className="absolute inset-0 flex items-center justify-center text-yellow-500">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-white tracking-[0.4em] uppercase animate-pulse">
                Decrypting...
              </h2>
            </motion.div>
          )}

          {flowState === "authenticated" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center gap-6"
            >
              <motion.div 
                initial={{ rotate: -10, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-32 h-32 bg-[#eab308] rounded-full flex items-center justify-center shadow-[0_0_100px_rgba(234,179,8,0.4)]"
              >
                <CheckCircle className="w-16 h-16 text-[#0e100f]" />
              </motion.div>
              <div className="text-center space-y-2">
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter"
                >
                  Access Granted
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-yellow-500/80 text-xl font-medium"
                >
                  Welcome back, <span className="text-white underline underline-offset-8 decoration-[#eab308]">{profileName}</span>
                </motion.p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
     