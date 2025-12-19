
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/lib/utils";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase";

const APP_ID = 'glass-pro-3a83';

interface EditCustomerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSave: (customer: Customer) => void;
}

export default function EditCustomerDialog({
  isOpen,
  onOpenChange,
  customer,
  onSave,
}: EditCustomerDialogProps) {
  const { db, showAppModal, userProfile, isMapsApiReady } = useAppContext();
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const { toast } = useToast();
  
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  const setupAutocomplete = useCallback(() => {
    if (!isMapsApiReady || !addressInputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      {
        types: ["address"],
        componentRestrictions: { country: "us" },
        fields: ["formatted_address"],
      }
    );
    autocompleteRef.current = autocomplete;

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setFormData((prev) => ({ ...prev, address: place.formatted_address }));
      }
    });
  }, [isMapsApiReady]);

  useEffect(() => {
    if (isOpen) {
      setFormData(customer);
      if (addressInputRef.current) {
        setupAutocomplete();
      }
    }
  }, [isOpen, customer, setupAutocomplete]);

  useEffect(() => {
    if (isOpen && addressInputRef.current) {
        setupAutocomplete();
    }
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
    if (!formData.id) return showAppModal("Customer ID is missing.", "destructive");

    const customerRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`, formData.id);
    const { id, ...customerToUpdate } = formData;
    
    updateDocumentNonBlocking(customerRef, {
        ...customerToUpdate,
        phone: formData.phone.replace(/[^\d]/g, ''),
        updatedAt: serverTimestamp()
    });

    onSave(formData as Customer);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-md overflow-x-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update the details for {customer.name}.
          </DialogDescription>
        </DialogHeader>

        <form
          id="edit-customer-form"
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
                value={formData.address || ""}
                onChange={handleInputChange}
                placeholder={isMapsApiReady ? "Start typing to autocomplete..." : "Address autocomplete unavailable"}
                disabled={!isMapsApiReady}
              />
          </div>
           <div className="space-y-3 rounded-md border p-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                    id="isTaxExempt"
                    checked={formData.isTaxExempt || false}
                    onCheckedChange={(checked) => setFormData(prev => ({...prev, isTaxExempt: !!checked}))}
                    />
                    <Label htmlFor="isTaxExempt" className="cursor-pointer font-medium">This customer is tax-exempt.</Label>
                </div>
                {formData.isTaxExempt && (
                    <div className="space-y-2 pl-6">
                        <Label htmlFor="taxId">Sales Tax ID</Label>
                        <Input id="taxId" name="taxId" value={formData.taxId || ''} onChange={handleInputChange} />
                    </div>
                )}
              </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form="edit-customer-form">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
