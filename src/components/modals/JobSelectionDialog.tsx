
"use client";

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '@/hooks/useAppContext';

interface JobSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
  selectedDate: Date;
  onSelectJob: (job: Job) => void;
  onRescheduleJob?: (job: Job) => void;
  onAssignTechnician?: (job: Job) => void;
}

export default function JobSelectionDialog({
  isOpen,
  onOpenChange,
  jobs,
  selectedDate,
  onSelectJob,
  onRescheduleJob,
  onAssignTechnician
}: JobSelectionDialogProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scheduled Jobs</DialogTitle>
          <DialogDescription>
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-80 w-full rounded-md border p-2">
            {jobs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No scheduled jobs for this day.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map(job => (
                    <Card key={job.id} className="bg-card">
                        <CardContent className="p-4">
                            <p className="font-semibold text-primary">Job {job.jobId || job.id.substring(0,6)}</p>
                            <p className="text-sm text-foreground">Customer: {job.customerName}</p>
                            <p className="text-sm text-muted-foreground">Vehicle: {job.make} {job.model} ({job.year})</p>
                            <p className="text-sm text-muted-foreground">Time: {job.scheduledTime || 'Not specified'}</p>
                            {job.technicianName && <p className="text-sm text-muted-foreground">Technician: {job.technicianName}</p>}
                            <div className="flex justify-end space-x-2 mt-3">
                              {onRescheduleJob && (
                                <Button size="sm" variant="outline" onClick={() => onRescheduleJob(job)}>
                                  Reschedule
                                </Button>
                              )}
                              {onAssignTechnician && (
                                <Button size="sm" variant="outline" onClick={() => onAssignTechnician(job)}>
                                  Technician
                                </Button>
                              )}
                              <Button size="sm" onClick={() => onSelectJob(job)}>
                                View Details
                              </Button>
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>
            )}
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
