
"use client";

import { useState, useEffect } from 'react';
import type { Job, Technician } from '@/lib/types';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';
import { Loader2, UserCheck } from 'lucide-react';
import { collection, onSnapshot, doc } from 'firebase/firestore';

const APP_ID = 'glass-pro-3a83';

interface TechnicianAssignDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onAssign: (jobId: string, tech: Technician) => void;
}

export default function TechnicianAssignDialog({
  isOpen,
  onOpenChange,
  job,
  onAssign,
}: TechnicianAssignDialogProps) {
  const { db, userProfile } = useAppContext();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !db || !userProfile?.id) return;

    const techsRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/technicians`);
    const unsubscribe = onSnapshot(techsRef, (snapshot) => {
        setTechnicians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician)));
        setLoading(false);
    }, () => {
        setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, db, userProfile?.id]);
  
  const handleAssignClick = (tech: Technician) => {
    onAssign(job.id, tech);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Technician</DialogTitle>
          <DialogDescription>
            Assign a technician to Job {job.jobId || job.id.substring(0, 6)}.
            <p>Currently assigned: <strong>{job.technicianName || 'Unassigned'}</strong></p>
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-60 w-full rounded-md border">
            {loading ? (
                 <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : technicians.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground p-4 text-center">No technicians found. You can add them in Settings.</p>
                </div>
            ) : (
                <div className="p-2 space-y-1">
                    {technicians.map(tech => (
                        <button
                            key={tech.id}
                            onClick={() => handleAssignClick(tech)}
                            className={cn(
                                "w-full text-left p-3 rounded-md hover:bg-muted flex items-center justify-between",
                                job.technicianId === tech.id && "bg-primary text-primary-foreground hover:bg-primary"
                            )}
                        >
                            <span>{tech.name}</span>
                            {job.technicianId === tech.id && <UserCheck className="h-5 w-5" />}
                        </button>
                    ))}
                </div>
            )}
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

