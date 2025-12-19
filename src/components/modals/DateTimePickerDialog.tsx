
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Job } from '@/lib/types';
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
import { Calendar } from '@/components/ui/calendar';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Home, Truck } from 'lucide-react';

interface DateTimePickerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string | Date;
  initialTime?: string;
  initialServiceType?: 'In-Shop' | 'Mobile';
  onSave: (date: string, time: string, serviceType: 'In-Shop' | 'Mobile', job?: Job) => void;
  jobToReschedule?: Job | null;
}

export default function DateTimePickerDialog({
  isOpen,
  onOpenChange,
  initialDate,
  initialTime,
  initialServiceType = 'In-Shop',
  onSave,
  jobToReschedule = null,
}: DateTimePickerDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialDate ? new Date(initialDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(initialTime || '');
  const [selectedServiceType, setSelectedServiceType] = useState<'In-Shop' | 'Mobile'>(initialServiceType);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
        setSelectedDate(initialDate ? new Date(initialDate) : new Date());
        setSelectedTime(initialTime || '');
        setSelectedServiceType(initialServiceType || 'In-Shop');
    }
  }, [isOpen, initialDate, initialTime, initialServiceType]);

  const handleSave = () => {
    if (!selectedDate) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a date.' });
      return;
    }
    if (!selectedTime) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please select a time or period.' });
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    onSave(dateString, selectedTime, selectedServiceType, jobToReschedule as Job);
    onOpenChange(false);
  };
  
  const inShopTimeOptions = useMemo(() => {
    const times = [];
    for (let i = 7; i <= 19; i++) {
      const hour = String(i).padStart(2, '0');
      times.push(`${hour}:00`);
    }
    return times;
  }, []);

  const mobileTimeOptions = useMemo(() => ['AM', 'PM', 'All Day'], []);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Schedule</DialogTitle>
          <DialogDescription>
            {jobToReschedule ? `Reschedule Job ${jobToReschedule.jobId || jobToReschedule.id.substring(0,6)}` : 'Select a date, time, and service type.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border p-3"
            />
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium">Service Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant={selectedServiceType === 'In-Shop' ? 'default' : 'outline'} onClick={() => setSelectedServiceType('In-Shop')}>
                    <Home className="mr-2 h-4 w-4" /> In-Shop
                  </Button>
                  <Button variant={selectedServiceType === 'Mobile' ? 'default' : 'outline'} onClick={() => setSelectedServiceType('Mobile')}>
                    <Truck className="mr-2 h-4 w-4" /> Mobile
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="timePicker" className="text-sm font-medium">Time</label>
                <Select onValueChange={setSelectedTime} value={selectedTime}>
                  <SelectTrigger id="timePicker" className="w-full mt-2">
                    <SelectValue placeholder={`Select ${selectedServiceType === 'In-Shop' ? 'Time' : 'Period'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedServiceType === 'In-Shop' ? inShopTimeOptions : mobileTimeOptions).map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
