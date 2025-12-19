
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { Customer, Job } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';
import { formatDateTime } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Navigation } from 'lucide-react';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';

const APP_ID = 'glass-pro-3a83';

interface CustomerDetailProps {
  customer: Customer;
  onSaveSuccess: () => void;
  onCancel: () => void;
}

export default function CustomerDetail({ customer, onSaveSuccess, onCancel }: CustomerDetailProps) {
  const { db, showAppModal, showCustomConfirmModal, navigateTo, userProfile, navigationParams, isMapsApiReady } = useAppContext();
  const [formData, setFormData] = useState<Partial<Customer>>({});
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const setupAutocomplete = useCallback(() => {
    if (isMapsApiReady && addressInputRef.current) {
        if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        }
        
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
    }
  }, [isMapsApiReady]);

  useEffect(() => {
    if (customer && customer.id && !customer.id.startsWith('temp-')) {
      setIsNewCustomer(false);
      setFormData(customer);
    } else {
      setIsNewCustomer(true);
      setFormData({ isTaxExempt: false, taxId: '', ...customer });
    }
    
    setTimeout(() => {
      setupAutocomplete();
    }, 100);
    
  }, [customer, setupAutocomplete]);


  useEffect(() => {
    if (isNewCustomer || !db || !userProfile?.id || !customer?.id) {
        setJobs([]);
        setJobsLoading(false);
        return;
    };
    
    const jobsQuery = query(collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/jobs`), where('customerId', '==', customer.id));
    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        setJobsLoading(false);
    }, (error) => {
        showAppModal(`Error fetching job history: ${error.message}`, 'destructive');
        setJobsLoading(false);
    });

    return () => unsubscribe();
  }, [customer, isNewCustomer, db, userProfile?.id, showAppModal]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === 'name') {
        formattedValue = value
            .split(' ')
            .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
            .join(' ');
    } else if (name === 'phone') {
        formattedValue = formatPhoneNumber(value);
    }
    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleLoadTestCustomer = () => {
    setFormData({
      name: 'Test Customer',
      phone: '(555) 123-4567',
      email: 'test.customer@example.com',
      address: '123 Test Street, Testville, TX 77777',
      isTaxExempt: false,
      taxId: '',
    });
    showAppModal('Test customer data loaded!');
  };
  
  const proceedWithSave = async (newCustomerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userProfile?.id || !db) return showAppModal("Not authenticated", "destructive");

    try {
        if (isNewCustomer) {
            const newDocRef = await addDocumentNonBlocking(collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`), { ...newCustomerData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            showAppModal("New customer created successfully.");
            
            if (navigationParams?.from === 'jobDetail' && newDocRef) {
                 navigateTo('jobDetail', navigationParams.job, { ...newCustomerData, id: newDocRef.id } as Customer, { newCustomer: { ...newCustomerData, id: newDocRef.id } });
            } else {
                onSaveSuccess();
            }
        } else {
            if (!formData.id) throw new Error("Customer ID missing for update.");
            const docRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`, formData.id);
            updateDocumentNonBlocking(docRef, { ...newCustomerData, updatedAt: serverTimestamp() });
            showAppModal("Customer updated successfully.");
            onSaveSuccess();
        }
    } catch (e: any) {
        showAppModal(`Error saving customer: ${e.message}`, "destructive");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return showAppModal("Name and Phone are required", "destructive");

    const customerToSave: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        phone: formData.phone.replace(/[^\d]/g, ''),
        email: formData.email || '',
        address: formData.address || '',
        isTaxExempt: formData.isTaxExempt || false,
        taxId: formData.isTaxExempt ? formData.taxId || '' : '',
    };
    await proceedWithSave(customerToSave);
  };

  const handleDeleteCustomer = () => {
    if (!userProfile?.id || !db || isNewCustomer || !formData.id) return;
    
    showCustomConfirmModal(
      `Are you sure you want to delete ${formData.name}? This will also delete all associated jobs and cannot be undone.`,
      () => {
        const docRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`, formData.id!);
        deleteDocumentNonBlocking(docRef);
        showAppModal("Customer deleted.");
        onCancel();
      }
    );
  };

  const JobHistory = () => (
    <Card>
        <CardHeader>
            <CardTitle>Job History</CardTitle>
            <CardDescription>All jobs associated with this customer.</CardDescription>
        </CardHeader>
        <CardContent>
            {jobsLoading ? (
                <p className="text-muted-foreground">Loading jobs...</p>
            ) : jobs.length === 0 ? (
                <p className="text-muted-foreground">No jobs found for this customer.</p>
            ) : (
                <div className="border rounded-md">
                    {jobs.map(job => (
                        <div 
                            key={job.id} 
                            onClick={() => navigateTo('jobDetail', job)}
                            className="flex justify-between items-center p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0"
                        >
                            <div>
                                <p className="font-semibold">Job #{job.jobId}</p>
                                <p className="text-sm text-muted-foreground">{job.year} {job.make} {job.model}</p>
                                <p className="text-xs text-muted-foreground">Created: {formatDateTime(job.createdAt)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={job.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{job.status}</Badge>
                                <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isNewCustomer ? 'Add New Customer' : `Edit Customer: ${formData.name || ''}`}</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Customer Name *</Label>
                <Input id="name" name="name" value={formData.name || ''} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} required placeholder="(xxx) xxx-xxxx" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="address" 
                    name="address"
                    ref={addressInputRef}
                    defaultValue={formData.address || ''} 
                    onChange={handleChange}
                    disabled={!isMapsApiReady}
                    placeholder={isMapsApiReady ? "Start typing to autocomplete..." : "Address autocomplete unavailable"}
                    className="flex-grow"
                  />
                  {formData.address && (
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formData.address || '')}`} target="_blank" rel="noopener noreferrer">
                        <Navigation className="h-5 w-5 text-blue-500"/>
                      </a>
                    </Button>
                  )}
                </div>
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
                        <Input id="taxId" name="taxId" value={formData.taxId || ''} onChange={handleChange} />
                    </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button type="submit" className="w-full">
                    Save
                </Button>
                {!isNewCustomer && (
                    <Button type="button" variant="destructive" onClick={handleDeleteCustomer} className="w-full">
                      Delete
                    </Button>
                )}
                <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                    Cancel
                </Button>
            </CardFooter>
          </form>
        </Card>

        {!isNewCustomer && <JobHistory />}
    </div>
  );
}
