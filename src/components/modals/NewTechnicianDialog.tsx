
"use client";

import { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatPhoneNumber } from '@/lib/utils';
import type { Technician } from '@/lib/types';
import { useAppContext } from '@/hooks/useAppContext';

interface NewTechnicianDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (technician: Partial<Technician>, resendInvite?: boolean) => Promise<void>;
  initialData?: Technician | null;
}

export default function NewTechnicianDialog({
  isOpen,
  onOpenChange,
  onSave,
  initialData = null,
}: NewTechnicianDialogProps) {
  const [formData, setFormData] = useState<Partial<Technician>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!initialData;

  useEffect(() => {
    if (isOpen) {
        if (isEditing) {
            setFormData(initialData);
        } else {
            setFormData({ name: '', phone: '', email: '' });
        }
    }
  }, [isOpen, initialData, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
        setFormData(prev => ({ ...prev, [name]: formatPhoneNumber(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent, resend: boolean = false) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Technician Name and Email are required.',
      });
      return;
    }
    
    setLoading(true);
    try {
        await onSave(formData, resend);
        if (!resend) {
          onOpenChange(false);
        }
    } catch (error) {
        // The onSave function now handles its own error UI
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Technician' : 'Invite New Technician'}</DialogTitle>
          <DialogDescription>
            {isEditing 
                ? "Update the technician's details." 
                : "Enter the details for the new technician. They will receive an invitation to join the app at the email provided."
            }
          </DialogDescription>
        </DialogHeader>
        <form id="new-technician-form" onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Technician Name *</Label>
            <Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (for login) *</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email || ''} 
              onChange={handleInputChange} 
              required 
              disabled={isEditing && !!formData.userId}
              title={isEditing && !!formData.userId ? "Email cannot be changed for an active user." : ""}
            />
             {isEditing && !!formData.userId && (
                <p className="text-xs text-muted-foreground">Email cannot be changed for an active user.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleInputChange} placeholder="(xxx) xxx-xxxx" />
          </div>
        </form>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            {isEditing && !formData.userId && (
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Resend Invite'}
                </Button>
            )}
          </div>
          <div className="flex gap-2 self-end">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="new-technician-form" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : isEditing ? 'Save Changes' : 'Save & Invite'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
