
"use client";

import { useState, useEffect } from 'react';
import type { Job, PaymentType } from '@/lib/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Banknote } from 'lucide-react';

interface CollectPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onSave: (paymentData: { amount: number; type: PaymentType; notes: string }) => void;
}

export default function CollectPaymentDialog({
  isOpen,
  onOpenChange,
  job,
  onSave,
}: CollectPaymentDialogProps) {
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<PaymentType>('Cash');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const balanceDue = (job?.totalAmount || 0) - (job?.amountPaid || 0);

  useEffect(() => {
    if (isOpen && job) {
      setAmount(balanceDue);
      setType('Cash');
      setNotes('');
    }
  }, [isOpen, job, balanceDue]);

  const handleSave = () => {
    if (amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Payment amount must be greater than zero.' });
      return;
    }
    onSave({ amount, type, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Record a payment for Job #{job.jobId}. Balance due is ${balanceDue.toFixed(2)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Payment Type</Label>
            <Select value={type} onValueChange={(value: PaymentType) => setType(value)}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Payment Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., Check #1234, last 4 digits of CC"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>
            <Banknote className="mr-2 h-4 w-4" /> Save Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
