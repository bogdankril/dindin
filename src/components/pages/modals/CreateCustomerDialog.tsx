
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Customer } from "@/lib/types";
import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/utils";
import { collection, serverTimestamp } from "firebase/firestore";
import { addDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

interface CreateCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (customer: Customer) => void;
}

export default function CreateCustomerDialog({
  isOpen,
  onOpenChange,
  onSave,
}: CreateCustomerDialogProps) {
  const { db, showAppModal, userProfile, isMapsApiReady } = useAppContext();
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const { toast } = useToast();
  
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const setupAutocomplete = useCallback(() => {
    if (isMapsApiReady && addressInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(
            addressInputRef.current,
            {
                types: ["address"],
                componentRestrictions: { country: 'us' },
                fields: ['formatted_address']
            }
        );
        autocompleteRef.current = autocomplete;
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.formatted_address) {
                setFormData(prev => ({ ...prev, address: place.formatted_address }));
            }
        });
    }
  }, [isMapsApiReady]);

  useEffect(() => {
    if (isOpen) {
      setFormData({}); // Reset form data when dialog opens
      // We need to wait a tick for the dialog and its content to be in the DOM
      setTimeout(() => {
        setupAutocomplete();
      }, 100);
    }
    
    return () => {
      // Cleanup listener when component unmounts or dialog closes
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isOpen, setupAutocomplete]);

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
    } else if (name === "phone") {
      formattedValue = formatPhoneNumber(value);
    }
    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id || !db) return showAppModal("Not authenticated", "destructive");
    if (!formData.name || !formData.phone) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Customer Name and Phone are required.",
      });
      return;
    }

    const customerData = {
        name: formData.name,
        phone: formData.phone.replace(/[^\d]/g, ''),
        email: formData.email || '',
        address: formData.address || '',
        isTaxExempt: false,
        taxId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    
    const customersRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`);
    
    try {
        const docRef = await addDocumentNonBlocking(customersRef, customerData);
        if (docRef) {
          const newCustomer = { id: docRef.id, ...customerData };
          onSave(newCustomer as Customer);
          onOpenChange(false);
        } else {
            throw new Error("Failed to get document reference after creation.");
        }
    } catch(err) {
        showAppModal(`Failed to save customer: ${err instanceof Error ? err.message : 'Unknown error'}`, 'destructive');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md overflow-x-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Create a new customer record. This will be automatically associated
            with the current job.
          </DialogDescription>
        </DialogHeader>

        <form
          id="new-customer-form"
          onSubmit={handleSubmit}
          className="space-y-4 py-4"
        >
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              name="name"
              className="w-full"
              value={formData.name || ""}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              className="w-full"
              value={formData.phone || ""}
              onChange={handleInputChange}
              required
              placeholder="(xxx) xxx-xxxx"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              className="w-full"
              value={formData.email || ""}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
                id="address"
                name="address"
                ref={addressInputRef}
                className="w-full"
                defaultValue={formData.address || ""}
                onChange={handleInputChange}
                placeholder={isMapsApiReady ? "Start typing to autocomplete..." : "Address autocomplete unavailable"}
                disabled={!isMapsApiReady}
            />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="new-customer-form">
            Save Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
