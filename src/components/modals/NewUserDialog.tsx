
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BusinessProfile, UserProfile, UserRole } from '@/lib/types';
import { doc, onSnapshot, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { formatPhoneNumber } from '@/lib/utils';
import { getFunctions, httpsCallable } from 'firebase/functions';

const APP_ID = 'glass-pro-3a83';

interface NewUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewUserDialog({ isOpen, onOpenChange }: NewUserDialogProps) {
  const { db, auth, showAppModal, userProfile } = useAppContext();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'technician' as UserRole });
  const [loading, setLoading] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userProfile?.companyId && db) {
        // A user's company profile is stored under their own user ID if they are the admin/creator
        const companyProfileOwnerId = userProfile.companyId;
        const companyRef = doc(db, `artifacts/${APP_ID}/users/${companyProfileOwnerId}/settings/businessProfile`);
        const unsubscribe = onSnapshot(companyRef, (doc) => {
            if (doc.exists()) {
                setBusinessProfile(doc.data() as BusinessProfile);
            }
            setProfileLoading(false);
        }, () => setProfileLoading(false));

        return () => unsubscribe();
    }
  }, [isOpen, userProfile, db]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', phone: '', role: 'technician' as UserRole });
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "name") {
      formattedValue = value
        .split(" ")
        .map((word) =>
          word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""
        )
        .join(" ");
    } else if (name === 'phone') {
        formattedValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };
  
  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({...prev, role }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessProfile?.name || !userProfile?.companyId || !userProfile?.email || !auth || !db) {
        toast({ variant: 'destructive', title: 'Error', description: 'Context not available. Please wait or set a company name in Business Profile.' });
        return;
    }
    if (!formData.name || !formData.email) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Name and Email are required.' });
      return;
    }

    setLoading(true);

    try {
        const usersRef = collection(db, `users`);
        
        const newUserInvite: Partial<UserProfile> = {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            companyId: userProfile.companyId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const userDocRef = await addDoc(usersRef, newUserInvite);
        
        const functions = getFunctions(auth.app);
        const sendInvite = httpsCallable(functions, 'sendInvite');
        
        const inviteUrl = `${window.location.origin}/register?email=${encodeURIComponent(formData.email)}&companyId=${userProfile.companyId}&inviteId=${userDocRef.id}`;

        const emailResult: any = await sendInvite({
            technicianName: formData.name,
            technicianEmail: formData.email,
            companyName: businessProfile.name,
            fromEmail: userProfile.email,
            appUrl: inviteUrl,
        });

        if (emailResult?.data?.success) {
            showAppModal(emailResult.data.message, 'default');
        } else {
            const errorMessage = emailResult?.data?.message || 'An unknown error occurred while sending the invitation.';
            throw new Error(errorMessage);
        }

        onOpenChange(false);
        
    } catch (error: any) {
        console.error("Error in handleSubmit:", error);
        const errorMessage = error.message || 'An unexpected error occurred.';
        showAppModal(`Failed to invite user: ${errorMessage}`, 'destructive');
    } finally {
        setLoading(false);
    }
  };

  const isSubmitDisabled = loading || profileLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
          <DialogDescription>
            Enter the user's details and assign a role. They will receive an email invitation to join your company.
          </DialogDescription>
        </DialogHeader>
        <form id="new-user-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
          </div>
           <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(xxx) xxx-xxxx" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="manager">Manager (Admin-defined Access)</SelectItem>
                    <SelectItem value="technician">Technician (Admin-defined Access)</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="new-user-form" disabled={isSubmitDisabled}>
            {loading ? <Loader2 className="animate-spin" /> : (profileLoading ? 'Loading...' : 'Send Invite')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
