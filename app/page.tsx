"use client";

import { useEffect, useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Sun, Moon, Loader2 } from "lucide-react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function Home() {
  const [value, setValue] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = () => {
    if (value === "123456") {
      setIsAuthenticated(true);
      setIsLoading(true);
      setShowError(false);
      
      // Simulate loading time and then redirect
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000); // 2 seconds loading time
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleReset = () => {
    setValue("");
    setIsAuthenticated(false);
    setIsLoading(false);
    setShowError(false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Show loading state after successful authentication
  if (isLoading) {
    return (
      <AuroraBackground>
        <Card className="w-full max-w-md text-center bg-white/80 dark:bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl text-green-600 dark:text-green-400">Authentication Successful!</CardTitle>
            <CardDescription className="dark:text-gray-300">
              Redirecting to dashboard...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-ping"></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we prepare your dashboard...
              </div>
            </div>
          </CardContent>
        </Card>
      </AuroraBackground>
    );
  }

  return (
    <AuroraBackground>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 bg-white/80 "
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
      <Card className="w-full max-w-md bg-white/80 dark:bg-transparent dark:border-2 dark:border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-20  items-center justify-center rounded-full flex-col ">
            <img src={"/assets/logo.png"} alt="logo" />
          </div>
          <CardTitle className="text-2xl dark:text-white">Wellcome To Zain Gems</CardTitle>
          <CardDescription className="dark:text-gray-300">
            Please enter the 6-digit passcode to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP
              value={value}
              onChange={(val) => setValue(val)}
              maxLength={6}
              containerClassName="gap-2"
            >
              <InputOTPGroup className="gap-1">
                <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
                <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
                <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
                <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
                <InputOTPSlot index={4} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
                <InputOTPSlot index={5} className="w-12 h-12 text-lg font-semibold border-2 rounded-lg bg-white/90 dark:bg-transparent dark:text-white" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          
          {showError && (
            <div className="flex items-center justify-center space-x-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Incorrect passcode. Please try again.</span>
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={handleSubmit} 
              className="w-full h-12 text-lg font-semibold"
              disabled={value.length !== 6}
            >
              Submit
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hint: The passcode is <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">123456</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AuroraBackground>
  );
}     