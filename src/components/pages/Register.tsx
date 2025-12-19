
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp, collection, getDoc, writeBatch } from 'firebase/firestore';
import type { UserProfile, BusinessProfile, JobIdSettings, ThemeSettings } from '@/lib/types';
import { useSearchParams } from 'next/navigation';

const APP_ID = 'glass-pro-3a83';

export default function Register() {
  const { db, auth, navigateTo, showAppModal } = useAppContext();
  const searchParams = useSearchParams();
  const [isInvite, setIsInvite] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    const email = searchParams.get('email');
    const companyId = searchParams.get('companyId');
    if (email && companyId) {
      setIsInvite(true);
      setFormData(prev => ({ ...prev, email }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return showAppModal("Firebase is not ready. Please try again.", "destructive");
    if (formData.password !== formData.confirmPassword) return showAppModal('Passwords do not match.', 'destructive');
    if (!formData.name) return showAppModal('Name is required.', 'destructive');
    if (!isInvite && !formData.companyName) return showAppModal('Company Name is required.', 'destructive');
    
    setLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: formData.name });

      const companyId = isInvite ? searchParams.get('companyId')! : user.uid;
      const inviteId = searchParams.get('inviteId');
      
      await runTransaction(db, async (transaction) => {
        if (isInvite) {
          if (!inviteId || !companyId) throw new Error("Invitation details are missing.");
          const inviteRef = doc(db, "users", inviteId);
          const inviteDoc = await transaction.get(inviteRef);
          if (!inviteDoc.exists()) {
            throw new Error("Invitation is invalid or has expired.");
          }
          
          const finalUserRef = doc(db, 'users', user.uid);
          const invitedUserData = inviteDoc.data();
          
          const newUserProfile: Omit<UserProfile, 'id'> = {
            uid: user.uid,
            email: user.email!,
            name: formData.name,
            role: invitedUserData.role,
            companyId: companyId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          transaction.set(finalUserRef, newUserProfile);
          transaction.delete(inviteRef);

        } else {
          // New company registration
          const userRef = doc(db, 'users', user.uid);
          
          const newUserProfile: Omit<UserProfile, 'id'> = {
            uid: user.uid,
            email: user.email!,
            name: formData.name,
            role: 'admin',
            companyId: user.uid, // The user's own UID is their companyId
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          transaction.set(userRef, newUserProfile);

          // Create default settings under the user's own company structure
          const settingsPath = `artifacts/${APP_ID}/users/${user.uid}/settings`;

          const businessProfileRef = doc(db, settingsPath, 'businessProfile');
          const defaultBusinessProfile: Omit<BusinessProfile, 'id'> = {
              name: formData.companyName,
              email: formData.email,
              address: '',
              phone: '',
              website: '',
              colorScheme: 'default',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
          };
          transaction.set(businessProfileRef, defaultBusinessProfile);

          const jobIdSettingsRef = doc(db, settingsPath, 'jobIdGeneration');
          const defaultJobIdSettings: JobIdSettings = { prefix: 'W', nextJobNumber: 1001, quotePrefix: 'Q', nextQuoteNumber: 101 };
          transaction.set(jobIdSettingsRef, defaultJobIdSettings);

          const themeSettingsRef = doc(db, settingsPath, 'theme');
          const defaultThemeSettings: ThemeSettings = { colorScheme: 'default', template: 'modern' };
          transaction.set(themeSettingsRef, defaultThemeSettings);

          transaction.set(doc(db, settingsPath, 'salesTax'), { rate: 0 });
          transaction.set(doc(db, settingsPath, 'scheduleView'), { defaultView: 'threeDay' });
          transaction.set(doc(db, settingsPath, 'partsLookup'), {});
        }
      });

      await sendEmailVerification(user);
      setRegistrationSuccess(true);

    } catch (error: any) {
      let errorMessage = "An unknown error occurred during registration.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email address is already in use. Please try logging in, or use the "Forgot Password" link on the login page if you have forgotten your password.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'The email address is not valid. Please check it and try again.';
          break;
        default:
          errorMessage = `Registration failed: ${error.message}`;
          break;
      }
      showAppModal(errorMessage, 'destructive');
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl">Registration Successful!</CardTitle>
            <CardDescription className="text-sm">Please check your email to verify your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              A verification link has been sent to <strong>{formData.email}</strong>. Once verified, you can log in.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigateTo('login')}>
              Proceed to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl">{isInvite ? 'Complete Your Registration' : 'Create Your Account'}</CardTitle>
          <CardDescription className="text-sm">{isInvite ? 'You have been invited to join a company. Please complete your registration.' : 'Register a new company to get started.'}</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" value={formData.email} onChange={handleChange} required readOnly={isInvite} />
            </div>
            {!isInvite && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : <><UserPlus className="mr-2 h-4 w-4" /> {isInvite ? 'Complete Registration' : 'Create Account'}</>}
            </Button>
            {!isInvite && (
                <Button variant="link" onClick={() => navigateTo('login')} className="p-0 h-auto">
                    Already have an account? Login
                </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
