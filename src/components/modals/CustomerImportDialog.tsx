
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import Image from 'next/image';
import placeholderImages from '@/lib/placeholder-images.json';

interface CustomerImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onFileSelect: (file: File) => void;
  isImporting: boolean;
}

export default function CustomerImportDialog({
  isOpen,
  onOpenChange,
  onFileSelect,
  isImporting,
}: CustomerImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Customers from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk-import customer records.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <h4 className="font-semibold">File Format Instructions</h4>
            <p className="text-sm text-muted-foreground">
                Your CSV file must contain a header row. The importer will look for the following column headers (case-insensitive):
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li><code className="bg-muted px-1 py-0.5 rounded font-mono">name</code> or <code className="bg-muted px-1 py-0.5 rounded font-mono">fullname</code> (Required)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded font-mono">phone</code> or <code className="bg-muted px-1 py-0.5 rounded font-mono">phonenumber</code> (Required)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded font-mono">email</code> or <code className="bg-muted px-1 py-0.5 rounded font-mono">emailaddress</code> (Optional)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded font-mono">address</code> (Optional)</li>
            </ul>

             <h4 className="font-semibold pt-2">Example Structure</h4>
            <div className="relative w-full h-24 rounded-md overflow-hidden border">
                <Image 
                    src={placeholderImages.csvImportExample.src}
                    alt="CSV file structure example"
                    width={800}
                    height={200}
                    style={{ objectFit: 'contain' }}
                    data-ai-hint={placeholderImages.csvImportExample.hint}
                />
            </div>

        </div>
        <DialogFooter>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
            <Button 
                type="button" 
                onClick={handleImportClick} 
                disabled={isImporting}
                className="w-full"
            >
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isImporting ? 'Processing...' : 'Choose CSV File to Import'}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    