
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload } from 'lucide-react';
import type { Customer } from '@/lib/types';
import Papa from 'papaparse';
import CustomerImportDialog from '../modals/CustomerImportDialog';
import CustomerDetail from './CustomerDetail';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

const APP_ID = 'glass-pro-3a83';

function CustomerListComponent({
  loading,
  filteredCustomers,
  selectedCustomer,
  setSelectedCustomer,
  searchTerm,
  setSearchTerm,
  isImporting,
  setShowImportDialog,
  handleCreateNew,
}: {
  loading: boolean;
  filteredCustomers: Customer[];
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isImporting: boolean;
  setShowImportDialog: (show: boolean) => void;
  handleCreateNew: () => void;
}) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>All Customers</CardTitle>
        <CardDescription>Manage your customer records.</CardDescription>
        <div className="flex w-full items-center gap-2 pt-2">
          <Input
            placeholder="Search customers..."
            className="flex-grow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button onClick={() => setShowImportDialog(true)} variant="outline" size="icon" disabled={isImporting}>
            <Upload className="h-4 w-4" />
          </Button>
          <Button onClick={handleCreateNew} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
         {loading ? (
          <p className="text-muted-foreground text-center py-10">Loading customers...</p>
        ) : (
          <ScrollArea className="h-full">
            {filteredCustomers.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No customers match your search.</p>
            ) : (
                <div className="border rounded-md">
                    {filteredCustomers.map((customer) => (
                    <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className={cn("flex justify-between items-center p-4 cursor-pointer hover:bg-muted/50 border-b last:border-b-0", selectedCustomer?.id === customer.id && "bg-muted/50")}>
                        <p className="font-medium">{customer.name}</p>
                    </div>
                    ))}
                </div>
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}


export default function CustomersList() {
  const { db, showAppModal, userProfile } = useAppContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!db || !userProfile?.id) return;
    const customersRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`);
    const unsubscribe = onSnapshot(customersRef, (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching customers: ${error.message}`, 'destructive');
        setLoading(false);
    });
    return () => unsubscribe();
  }, [db, showAppModal, userProfile?.id]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const handleFileImport = (file: File) => {
    if (!db || !userProfile?.id) return showAppModal("Not authenticated", "destructive");
    
    setIsImporting(true);
    setShowImportDialog(false);
    showAppModal("Starting import... This may take a moment.", "default");

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const batch = writeBatch(db);
            const customersRef = collection(db, `artifacts/${APP_ID}/users/${userProfile!.id}/customers`);
            let count = 0;

            results.data.forEach((row: any) => {
                const name = row.name || row.fullname;
                const phone = row.phone || row.phonenumber;

                if (name && phone) {
                    const newCustomerRef = doc(customersRef);
                    const newCustomer: Omit<Customer, 'id'> = {
                        name: name,
                        phone: phone.replace(/\D/g, ''),
                        email: row.email || row.emailaddress || '',
                        address: row.address || '',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                    };
                    batch.set(newCustomerRef, newCustomer);
                    count++;
                }
            });

            if (count > 0) {
                try {
                    await batch.commit();
                    showAppModal(`${count} customers imported successfully!`, "default");
                } catch (error: any) {
                    showAppModal(`Import failed: ${error.message}`, "destructive");
                }
            } else {
                showAppModal("No valid customer data found in the file.", "destructive");
            }
            setIsImporting(false);
        },
        error: (error: any) => {
            showAppModal(`CSV Parsing Error: ${error.message}`, "destructive");
            setIsImporting(false);
        }
    });
  };

  const handleCreateNew = () => {
    setSelectedCustomer({ id: `temp-${Date.now()}` } as Customer);
  };

  const handleBackToList = () => {
    setSelectedCustomer(null);
  };

  const DetailView = () => {
    if (!selectedCustomer) {
      return (
        <div className="hidden md:flex items-center justify-center h-full text-muted-foreground rounded-lg border border-dashed">
          <p>Select a customer to view their details.</p>
        </div>
      );
    }
    return <CustomerDetail customer={selectedCustomer} onSaveSuccess={handleBackToList} onCancel={handleBackToList} />;
  }

  const listProps = {
    loading,
    filteredCustomers,
    selectedCustomer,
    setSelectedCustomer,
    searchTerm,
    setSearchTerm,
    isImporting,
    setShowImportDialog,
    handleCreateNew,
  };

  if (isMobile) {
    return selectedCustomer ? <DetailView /> : <CustomerListComponent {...listProps} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <div className="md:col-span-1 h-full">
          <CustomerListComponent {...listProps} />
        </div>
        <div className="md:col-span-1 h-full">
          <DetailView />
        </div>
      </div>
      <CustomerImportDialog 
        isOpen={showImportDialog}
        onOpenChange={setShowImportDialog}
        onFileSelect={handleFileImport}
        isImporting={isImporting}
      />
    </>
  );
}
