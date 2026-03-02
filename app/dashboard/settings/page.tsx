 'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  Eye,
  EyeOff,
  Loader2,
  Lock
} from "lucide-react";
import { useState } from "react";

const ROOT_PASSWORD = "admin123"; // In a real app, this should be stored securely and hashed

export default function SettingsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (password === ROOT_PASSWORD) {
        setIsAuthenticated(true);
        toast.success("Authentication successful");
      } else {
        toast.error("Invalid password");
      }
    } catch (error) {
      toast.error("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-[400px] bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Lock className="h-5 w-5 mr-2" />
              Administrator Access Required
            </CardTitle>
            <CardDescription className="text-gray-300">
              Please enter the root password to access settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-white">Root Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="bg-white/10 border-white/20 text-white pr-10"
                    placeholder="Enter root password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Access Settings"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="text-gray-300">Manage your system settings</p>
          </div>
          <Button
            variant="outline"
            className="text-white border-white/20 hover:bg-white/10"
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription className="text-gray-300">
              Configure system-wide settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">Settings content goes here...</p>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}