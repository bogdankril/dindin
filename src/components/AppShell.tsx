
'use client';

import { useAppContext } from '@/hooks/useAppContext';
import { MailCheck, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { sendEmailVerification } from 'firebase/auth';
import { FirebaseErrorListener } from './FirebaseErrorListener';
import Login from './pages/Login';
import Register from './pages/Register';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icons } from '@/components/Icons';
import MainAppLayout from '@/app/MainAppLayout';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const {
    user,
    isDataLoaded,
    userProfile,
    isUserVerified,
    showAppModal,
    auth,
    navigateTo,
    currentPage
  } = useAppContext();

  // Show a loading spinner while waiting for auth state and user data
  if (!isDataLoaded || (user && !userProfile && currentPage !== 'register')) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground/70">
            Loading GlassPro...
          </p>
        </div>
      </div>
    );
  }

  // If there's no user, show the appropriate public page (Login or Register)
  if (!user) {
     if (currentPage === 'register') {
      return <Register />;
    }
    return <Login />;
  }
  
  // If the user exists but their email is not verified, show the verification prompt
  if (!isUserVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MailCheck /> Verify Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              A verification link has been sent to <strong>{user.email}</strong>.
              Please check your inbox and click the link to continue.
            </p>
            <Button
              className="w-full"
              onClick={async () => {
                if (auth?.currentUser) {
                  try {
                    await sendEmailVerification(auth.currentUser);
                    showAppModal("Another verification email has been sent.");
                  } catch (error) {
                    showAppModal("Failed to send verification email.", "destructive");
                  }
                }
              }}
            >
              Resend Verification Email
            </Button>
          </CardContent>
           <CardFooter className="flex justify-center">
             <Button variant="link" onClick={() => {
                if (auth) {
                    auth.signOut();
                    navigateTo('login');
                }
             }}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // If user is logged in and verified, render the main app layout
  return (
      <>
        <FirebaseErrorListener />
        <MainAppLayout>
          {children}
        </MainAppLayout>
      </>
  );
}
