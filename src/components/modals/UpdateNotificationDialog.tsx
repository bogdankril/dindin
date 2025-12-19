
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Rocket } from 'lucide-react';
import { Icons } from '@/components/Icons';

interface UpdateNotificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  version: string;
}

export default function UpdateNotificationDialog({
  isOpen,
  onOpenChange,
  version,
}: UpdateNotificationDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('seenUpdateVersion', version);
    }
    onOpenChange(false);
  };

  const updateNotes = [
    { title: "Cleaner Vehicle Info", description: "Empty parentheses no longer appear in job lists when vehicle year is missing." },
    { title: "Smarter 'All' Tab", description: "The 'All' tab in the jobs list now correctly includes both Work Orders and Quotes." },
    { title: "Cleaner Job IDs", description: "Removed redundant 'W'/'Q' prefixes from Job IDs on the Dashboard and Jobs List pages." },
    { title: "Responsive Reports", description: "The Reports page is now fully mobile-friendly, with no more horizontal scrolling." },
    { title: "Better Mobile UX", description: "The on-screen keyboard no longer automatically appears when adding a vehicle on mobile devices." },
    { title: "Streamlined Emailing", description: "The work order preview now prompts for an email address in a popup, decluttering the interface." },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            What's New in GlassPro
          </DialogTitle>
          <DialogDescription>
            We've made some improvements to enhance your experience.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-80 overflow-y-auto">
            <ul className="space-y-3">
                {updateNotes.map((note, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <Icons.checkCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">{note.title}</p>
                            <p className="text-sm text-muted-foreground">{note.description}</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label htmlFor="dont-show-again" className="text-sm font-normal">
              Don't show this again
            </Label>
          </div>
          <Button type="button" onClick={handleClose}>
            Got it!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
