
"use client";

import { useState } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { LogIn, Mail, Download } from "lucide-react";
import { Separator } from "../ui/separator";
import { useAuth } from '@/firebase';

export default function Login() {
  const { navigateTo, showAppModal, canInstallPwa, handleInstallPwa } = useAppContext();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return showAppModal("Authentication service is not available.", "destructive");
    if (!email || !password) return showAppModal("Please enter both email and password.", "destructive");
    
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener in AppProvider will handle successful navigation.
    } catch (error: any) {
      let errorMessage = "An unknown error occurred during login. Please try again.";
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'A network error occurred. Please check your internet connection and try again.';
          break;
        default:
          errorMessage = `Login failed: ${error.message}`;
          break;
      }
      showAppModal(errorMessage, 'destructive');
    } finally {
        setLoading(false);
    }
  };
  
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return showAppModal("Authentication service is not available.", "destructive");
    if (!email) return showAppModal("Please enter your email address to reset your password.", "destructive");

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showAppModal("Password reset email sent! Please check your inbox.");
      setIsResetMode(false);
    } catch (error: any) {
       let errorMessage = "Failed to send password reset email.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No user found with this email address.";
        }
        showAppModal(errorMessage, 'destructive');
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl">{isResetMode ? 'Reset Password' : 'Welcome to GlassPro Manager'}</CardTitle>
          <CardDescription>{isResetMode ? 'Enter your email to receive a reset link.' : 'Please sign in to continue'}</CardDescription>
        </CardHeader>

        {isResetMode ? (
          <form onSubmit={handlePasswordReset}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : <><Mail className="mr-2 h-4 w-4" /> Send Reset Link</>}
              </Button>
              <Button variant="link" onClick={() => setIsResetMode(false)} className="p-0 h-auto">
                Back to Login
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : <><LogIn className="mr-2 h-4 w-4" /> Login</>}
              </Button>
              <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 sm:gap-4 mt-2">
                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => navigateTo("register")}>
                  Don&apos;t have an account? Register
                </Button>
                <Button type="button" variant="link" className="p-0 h-auto" onClick={() => setIsResetMode(true)}>
                  Forgot Password?
                </Button>
              </div>

               {canInstallPwa && (
                <>
                  <Separator className="my-2" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleInstallPwa}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Install App
                  </Button>
                </>
              )}
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
