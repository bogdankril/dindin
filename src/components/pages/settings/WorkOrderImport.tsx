
"use client";

import { useState, useRef } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, FileUp } from 'lucide-react';
import Papa from 'papaparse';
import type { Customer, Job, JobItem, JobIdSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, writeBatch, serverTimestamp, doc, getDoc, runTransaction } from 'firebase/firestore';

const APP_ID = 'glass-pro-3a83';

export default function WorkOrderImport() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (file: File) => {
    if (!db || !userProfile?.id) return showAppModal("Not authenticated", "destructive");

    setIsImporting(true);
    showAppModal("Starting import process...", "default");

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const jobsToImport = results.data as any[];
            if (jobsToImport.length === 0) {
                showAppModal("CSV file is empty or invalid.", "destructive");
                setIsImporting(false);
                return;
            }

            try {
                const jobIdSettingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/jobIdGeneration`);
                let currentJobNumber = 0;

                await runTransaction(db, async (transaction) => {
                    const settingsDoc = await transaction.get(jobIdSettingsRef);
                    const currentSettings = settingsDoc.data() as JobIdSettings || { nextJobNumber: 1001, prefix: 'W' };
                    currentJobNumber = currentSettings.nextJobNumber;

                    const batch = writeBatch(db);
                    const customersRef = collection(db, `artifacts/${APP_ID}/users/${userProfile!.id}/customers`);
                    const jobsRef = collection(db, `artifacts/${APP_ID}/users/${userProfile!.id}/jobs`);

                    for (const row of jobsToImport) {
                        const newCustomerRef = doc(customersRef);
                        const newJobRef = doc(jobsRef);
                        
                        const newCustomer: Omit<Customer, 'id'> = {
                            name: row.customerName || 'N/A',
                            phone: (row.customerPhone || '').replace(/\D/g, ''),
                            email: row.customerEmail || '',
                            address: row.customerAddress || '',
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp(),
                        };
                        batch.set(newCustomerRef, newCustomer);

                        const jobDate = row.jobDate ? new Date(row.jobDate) : new Date();

                        const newJob: Omit<Job, 'id'> = {
                            jobId: `${currentSettings.prefix}${String(currentJobNumber).padStart(4, '0')}`,
                            customerId: newCustomerRef.id,
                            customerName: newCustomer.name,
                            year: row.vehicleYear || '',
                            make: row.vehicleMake || '',
                            model: row.vehicleModel || '',
                            vin: row.vehicleVin || '',
                            jobItems: [{
                                description: row.itemDescription || 'Imported Item',
                                price: parseFloat(row.itemPrice) || 0,
                                quantity: parseInt(row.itemQuantity) || 1,
                            }],
                            totalAmount: parseFloat(row.itemPrice) * parseInt(row.itemQuantity) || 0,
                            createdAt: jobDate,
                            updatedAt: serverTimestamp(),
                            status: 'completed',
                            isQuote: false,
                        } as Omit<Job, 'id'>;

                        batch.set(newJobRef, newJob);
                        currentJobNumber++;
                    }

                    transaction.update(jobIdSettingsRef, { nextJobNumber: currentJobNumber });
                    await batch.commit();
                });

                showAppModal(`${jobsToImport.length} work orders imported successfully!`, "default");
            } catch (error: any) {
                console.error("Import failed: ", error);
                showAppModal(`Import failed: ${error.message}`, "destructive");
            } finally {
                setIsImporting(false);
            }
        },
        error: (error: any) => {
            showAppModal(`CSV Parsing Error: ${error.message}`, "destructive");
            setIsImporting(false);
        }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Work Orders</CardTitle>
        <CardDescription>
          Upload a CSV file to bulk-import past work orders.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-semibold mb-2">CSV File Format Instructions</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Your CSV file must contain a header row with the exact column names specified below. All columns are required unless marked as optional.
          </p>
          <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Column Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Example</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow><TableCell className="font-mono">customerName</TableCell><TableCell>Full name of the customer.</TableCell><TableCell>John Doe</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">customerPhone</TableCell><TableCell>Customer's phone number.</TableCell><TableCell>555-123-4567</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">customerEmail</TableCell><TableCell>Optional. Customer's email.</TableCell><TableCell>john.d@email.com</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">customerAddress</TableCell><TableCell>Optional. Customer's address.</TableCell><TableCell>123 Main St, Anytown, USA</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">year</TableCell><TableCell>Year of the vehicle.</TableCell><TableCell>2022</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">make</TableCell><TableCell>Make of the vehicle.</TableCell><TableCell>Ford</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">model</TableCell><TableCell>Model of the vehicle.</TableCell><TableCell>F-150</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">vin</TableCell><TableCell>Optional. VIN of the vehicle.</TableCell><TableCell>1FT...</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">jobDate</TableCell><TableCell>Optional. Date of job (YYYY-MM-DD). Defaults to import date.</TableCell><TableCell>2023-10-27</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">itemDescription</TableCell><TableCell>Description of the main part or service.</TableCell><TableCell>Windshield Replacement</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">itemPrice</TableCell><TableCell>Price for the item.</TableCell><TableCell>350.00</TableCell></TableRow>
                    <TableRow><TableCell className="font-mono">itemQuantity</TableCell><TableCell>Quantity of the item.</TableCell><TableCell>1</TableCell></TableRow>
                </TableBody>
            </Table>
          </div>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
        <Button 
          type="button" 
          onClick={handleImportClick} 
          disabled={isImporting}
          className="w-full"
        >
          {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
          {isImporting ? 'Processing...' : 'Choose CSV File to Import'}
        </Button>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigateTo('settings')}>Back to Settings</Button>
      </CardFooter>
    </Card>
  );
}

