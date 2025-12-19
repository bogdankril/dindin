
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { JobDetailMobile } from './JobDetailMobile';
import JobDetailWeb from './JobDetailWeb';
import type { Job, Customer, Vehicle, BusinessProfile, ItemCode, JobItem, Technician, JobStatus, JobIdSettings, InventoryItem, UserProfile } from '@/lib/types';
import { onSnapshot, collection, doc, query, where, runTransaction, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function JobDetail({ job, navigationParams }: { job: Job, navigationParams: any }) {
  const { 
    db, showAppModal, navigateTo, 
    setShowWorkOrderPreviewModal, setWorkOrderPreviewData, showCustomConfirmModal,
    setShowEditCustomerModal, setEditCustomerModalProps,
    setShowNewVehicleModal, setNewVehicleModalProps,
    setShowDateTimePickerModal, setDateTimePickerModalProps,
    setShowCreateCustomerModal, setCreateCustomerModalProps,
    setShowCollectPaymentModal, setCollectPaymentModalProps,
    setShowAddItemModal, setAddItemModalProps,
    userProfile,
    previousPage
  } = useAppContext();

  const [formData, setFormData] = useState<Partial<Job>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  
  const [isNewJob, setIsNewJob] = useState(true);
  const [jobIdSettings, setJobIdSettings] = useState<JobIdSettings | null>(null);
  const [jobIdSettingsLoading, setJobIdSettingsLoading] = useState(true);
  const [companyProfile, setCompanyProfile] = useState<BusinessProfile | null>(null);
  const [defaultItemCodes, setDefaultItemCodes] = useState<ItemCode[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [salesTaxRate, setSalesTaxRate] = useState(0);

  const isMobile = useIsMobile();

  // --- DATA FETCHING & INITIALIZATION ---

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const userSettingsPath = `artifacts/${APP_ID}/users/${userProfile.id}`;

    const unsubCustomers = onSnapshot(collection(db, userSettingsPath, 'customers'), (snap) => setCustomers(snap.docs.map(d => ({id: d.id, ...d.data()} as Customer))));
    
    // Fetch users with the role of 'technician'
    const techniciansQuery = query(
      collection(db, 'users'), 
      where('companyId', '==', userProfile.id),
      where('role', '==', 'technician')
    );
    const unsubTechnicians = onSnapshot(techniciansQuery, (snap) => setTechnicians(snap.docs.map(d => ({id: d.id, ...d.data()} as UserProfile))));
    
    const unsubInventory = onSnapshot(collection(db, userSettingsPath, 'inventory'), (snap) => setInventoryItems(snap.docs.map(d => ({id: d.id, ...d.data()} as InventoryItem))));
    const unsubItemCodes = onSnapshot(collection(db, userSettingsPath, 'itemCodes'), (snap) => setDefaultItemCodes(snap.docs.map(d => ({id: d.id, ...d.data()} as ItemCode))));
    
    const unsubJobIdSettings = onSnapshot(doc(db, userSettingsPath, 'settings', 'jobIdGeneration'), (doc) => {
        setJobIdSettings(doc.data() as JobIdSettings);
        setJobIdSettingsLoading(false);
    });
    const unsubCompanyProfile = onSnapshot(doc(db, userSettingsPath, 'settings', 'businessProfile'), (doc) => setCompanyProfile(doc.data() as BusinessProfile));
    const unsubSalesTax = onSnapshot(doc(db, userSettingsPath, 'settings', 'salesTax'), (doc) => setSalesTaxRate(doc.data()?.rate || 0));

    return () => {
        unsubCustomers();
        unsubTechnicians();
        unsubInventory();
        unsubItemCodes();
        unsubJobIdSettings();
        unsubCompanyProfile();
        unsubSalesTax();
    }
  }, [db, userProfile?.id]);
  
  useEffect(() => {
    const isJobNew = !job || !job.id || job.id.startsWith('temp-');
    setIsNewJob(isJobNew);

    let initialJobState: Partial<Job>;

    if (isJobNew) {
        initialJobState = {
            ...(job || {}),
            jobItems: job?.jobItems ?? [],
            isQuote: navigationParams?.isQuote ?? job?.isQuote ?? false,
            serviceType: job?.serviceType ?? 'In-Shop',
            applySalesTax: job?.applySalesTax ?? salesTaxRate > 0,
            insuranceClaim: job?.insuranceClaim ?? false,
            deductible: job?.deductible ?? 0,
            status: job?.status ?? 'new',
        };
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
    } else {
        initialJobState = { ...job, jobItems: job.jobItems || [] };
        if (job.customerId && customers.length > 0) {
            const foundCustomer = customers.find(c => c.id === job.customerId);
            if (foundCustomer) {
                setSelectedCustomer(foundCustomer);
                setCustomerSearchTerm(foundCustomer.name);
            }
        }
    }
    
    setFormData(initialJobState);
    
    if (navigationParams?.newCustomer) {
      handleCustomerSelect(navigationParams.newCustomer, false);
    }

  }, [job, navigationParams, salesTaxRate, customers]);

  // --- CUSTOMER & VEHICLE LOGIC ---

  useEffect(() => {
    if (customerSearchTerm.length > 1 && customerSearchTerm !== selectedCustomer?.name) {
      setCustomerSuggestions(
        customers.filter(customer =>
          customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
          (customer.phone && customer.phone.includes(customerSearchTerm))
        ).slice(0, 5)
      );
      setShowCustomerSuggestions(true);
    } else {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
    }
  }, [customerSearchTerm, customers, selectedCustomer]);

  // --- JOB ITEM & FINANCIAL LOGIC ---

  const { subtotal, discountAmount, tax, total } = useMemo(() => {
    let subtotalVal = 0;
    let totalDiscount = 0;

    (formData.jobItems || []).forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.price || 0);
        subtotalVal += itemTotal;

        let itemDiscount = 0;
        if (item.discountType === '%') {
            itemDiscount = itemTotal * ((item.discountValue || 0) / 100);
        } else {
            itemDiscount = (item.discountValue || 0) * (item.quantity || 1);
        }
        totalDiscount += itemDiscount;
    });
    
    const subtotalAfterDiscount = subtotalVal - totalDiscount;
    const taxVal = formData.applySalesTax ? subtotalAfterDiscount * (salesTaxRate / 100) : 0;
    const totalVal = subtotalAfterDiscount + taxVal;
    
    return { subtotal: subtotalVal, discountAmount: totalDiscount, tax: taxVal, total: totalVal };
  }, [formData.jobItems, formData.applySalesTax, salesTaxRate]);

  useEffect(() => {
    setFormData(prev => ({...prev, totalAmount: total }));
  }, [total]);

  // --- HANDLERS ---
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;
    
    let parsedValue: string | number | boolean = isCheckbox ? checked : value;
    if (type === 'number') {
        parsedValue = parseFloat(value) || 0;
    }

    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };
  
  const updateForm = (field: keyof Job, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleCustomerSelect = (customer: Customer, updateTax: boolean = true) => {
    setSelectedCustomer(customer);
    const updates: Partial<Job> = {
      customerId: customer.id,
      customerName: customer.name,
    };
    if (updateTax) {
      updates.applySalesTax = !(customer.isTaxExempt || false);
    }
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
    setCustomerSearchTerm(customer.name);
    setShowCustomerSuggestions(false);
  };
  
  const handleVehicleSave = (vehicle: Partial<Vehicle>) => {
    setFormData(prev => ({
        ...prev,
        vin: vehicle.vin,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        bodyType: vehicle.bodyType,
    }));
  };

  const handleItemSave = (item: JobItem, index: number | null) => {
    if (index !== null) {
      // Update existing item
      const updatedItems = [...(formData.jobItems || [])];
      updatedItems[index] = item;
      setFormData(prev => ({ ...prev, jobItems: updatedItems }));
    } else {
      // Add new item
      setFormData(prev => ({ ...prev, jobItems: [...(prev.jobItems || []), item] }));
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({ ...prev, jobItems: (prev.jobItems || []).filter((_, i) => i !== index) }));
  };
  
  const openAddItemModal = (item: JobItem | null, index: number | null) => {
    setAddItemModalProps({
        onSave: handleItemSave,
        itemToEdit: item,
        editingIndex: index,
        defaultItemCodes: defaultItemCodes,
        inventoryItems: inventoryItems
    });
    setShowAddItemModal(true);
  }

  const handleOpenNewCustomerModal = () => {
    setCreateCustomerModalProps({ onSave: (customer: Customer) => handleCustomerSelect(customer, true) });
    setShowCreateCustomerModal(true);
  };
  
  const handleEditCustomer = () => {
      if (!selectedCustomer) return;
      setEditCustomerModalProps({
        customer: selectedCustomer,
        onSave: (updatedCustomer) => {
            setSelectedCustomer(updatedCustomer);
        }
      });
      setShowEditCustomerModal(true);
  }

  const handleScheduleSave = (date: string, time: string, serviceType: 'In-Shop' | 'Mobile') => {
    updateForm('scheduledDate', date);
    updateForm('scheduledTime', time);
    updateForm('serviceType', serviceType);
    if (formData.status === 'new') {
        updateForm('status', 'scheduled');
    }
  };

  const handleUnschedule = () => {
    showCustomConfirmModal(
      'Are you sure you want to unschedule this job? This will remove the date and time.',
      async () => {
        showAppModal("This feature is disabled as Firebase is not connected.", 'destructive');
      }
    );
  };
  
  const saveJob = async (statusOverride?: JobStatus, options: { navigateAway?: boolean } = { navigateAway: true }) => {
    if (!db || !userProfile?.id) return showAppModal("Not authenticated.", "destructive");
    if (!selectedCustomer?.id || !formData.make || !formData.model || !formData.year) {
      return showAppModal("Customer and complete vehicle information (Make, Model, Year) are required.", "destructive");
    }

    const jobData: Partial<Job> = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        year: formData.year,
        make: formData.make,
        model: formData.model,
        vin: formData.vin || '',
        bodyType: formData.bodyType || '',
        vehicleId: formData.vehicleId || '', // Ensure vehicleId is not undefined
        isQuote: formData.isQuote || false,
        status: statusOverride || formData.status || 'new',
        jobItems: formData.jobItems || [],
        totalAmount: total,
        amountPaid: formData.amountPaid || 0,
        paymentDate: formData.paymentDate || null,
        paymentType: formData.paymentType || null,
        paymentNotes: formData.paymentNotes || '',
        poNumber: formData.poNumber || '',
        serviceType: formData.serviceType || 'In-Shop',
        scheduledDate: formData.scheduledDate || '',
        scheduledTime: formData.scheduledTime || '',
        technicianId: formData.technicianId || '',
        technicianName: formData.technicianName || '',
        notes: formData.notes || '',
        insuranceClaim: formData.insuranceClaim || false,
        insuranceCompany: formData.insuranceCompany || '',
        deductible: formData.deductible || 0,
        applySalesTax: formData.applySalesTax || false,
        updatedAt: serverTimestamp(),
    };

    const jobsCollectionPath = `artifacts/${APP_ID}/users/${userProfile.id}/jobs`;

    if (isNewJob) {
        if (!jobIdSettings) return showAppModal("Job ID settings not found.", "destructive");
        
        try {
            const jobIdSettingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/jobIdGeneration`);
            
            await runTransaction(db, async (transaction) => {
                const settingsDoc = await transaction.get(jobIdSettingsRef);
                if (!settingsDoc.exists()) throw new Error("Job ID settings have been deleted.");
                
                const currentSettings = settingsDoc.data() as JobIdSettings;
                const isQuote = jobData.isQuote;
                const prefix = isQuote ? currentSettings.quotePrefix : currentSettings.prefix;
                const nextNumber = isQuote ? currentSettings.nextQuoteNumber : currentSettings.nextJobNumber;

                const newJobId = `${prefix}${String(nextNumber).padStart(4, '0')}`;
                
                const newJobRef = doc(collection(db, jobsCollectionPath));
                transaction.set(newJobRef, { ...jobData, jobId: newJobId, createdAt: serverTimestamp() });

                const settingsUpdate = isQuote 
                    ? { nextQuoteNumber: nextNumber + 1 }
                    : { nextJobNumber: nextNumber + 1 };
                
                transaction.update(jobIdSettingsRef, settingsUpdate);
            });
            
            showAppModal("Job created successfully!");
            if (options.navigateAway) navigateTo('jobsList');

        } catch (error: any) {
            showAppModal(`Failed to create job: ${error.message}`, "destructive");
        }

    } else {
        if (!formData.id) return showAppModal("Job ID is missing for update.", "destructive");
        const jobRef = doc(db, jobsCollectionPath, formData.id);
        updateDocumentNonBlocking(jobRef, jobData);
        showAppModal("Job updated successfully!");
        if (options.navigateAway) navigateTo('jobsList');
    }
  };

  const handleFinalSave = async () => {
    await saveJob(undefined, { navigateAway: true });
  };

  const handleCopyJob = async () => {
    if (jobIdSettingsLoading) return showAppModal("Job ID settings are still loading. Please wait.", "destructive");

    const jobToCopy: Partial<Job> = { ...formData };
    
    delete jobToCopy.id;
    delete jobToCopy.jobId;
    delete jobToCopy.createdAt;
    delete jobToCopy.updatedAt;
    delete jobToCopy.archivedAt;
    
    jobToCopy.status = 'new';
    jobToCopy.amountPaid = 0;
    delete jobToCopy.paymentDate;
    delete jobToCopy.paymentNotes;
    delete jobToCopy.paymentType;
    
    jobToCopy.scheduledDate = '';
    jobToCopy.scheduledTime = '';
    
    navigateTo('jobDetail', jobToCopy as Job, null, { isQuote: jobToCopy.isQuote });
  };


  const handleCompleteJob = () => {
    const isCompleted = formData.status === 'completed';
    const confirmMessage = isCompleted
        ? 'Are you sure you want to revert this job to an uncompleted status?'
        : 'Are you sure you want to mark this job as complete?';

    showCustomConfirmModal(confirmMessage, async () => {
        showAppModal("This feature is disabled as Firebase is not connected.", 'destructive');
    });
  };
  
  const handleArchiveJob = () => {
    if (isNewJob || !job?.id) return;
    showCustomConfirmModal(
      `Archive this ${formData.isQuote ? 'Quote' : 'Work Order'}? It will be moved to the archives.`,
      async () => {
        showAppModal("This feature is disabled as Firebase is not connected.", "destructive");
      }
    );
  };

  const handlePreviewWorkOrder = async () => {
    if (!selectedCustomer) {
        showAppModal("Please select a customer before previewing.", "destructive");
        return;
    }
    if (!companyProfile) {
        showAppModal("Company profile is not loaded.", "destructive");
        return;
    }
    setWorkOrderPreviewData({
        job: formData as Job,
        customer: selectedCustomer,
        companyProfile: companyProfile,
        salesTaxRate: salesTaxRate
    });
    setShowWorkOrderPreviewModal(true);
  };

  const handlePaymentSave = async (paymentData: { amount: number; type: Job['paymentType']; notes: string }) => {
    showAppModal("This feature is disabled as Firebase is not connected.", "destructive");
  };

  const handleCollectPayment = () => {
    if (!formData.id) return showAppModal("Please save the job before collecting payment.", "destructive");
    setCollectPaymentModalProps({
      job: formData as Job,
      onSave: handlePaymentSave,
    });
    setShowCollectPaymentModal(true);
  };

  const handleRevertPayment = () => {
    showCustomConfirmModal("Are you sure you want to revert this payment? This will reset the payment status and amount.", async () => {
        showAppModal("This feature is disabled as Firebase is not connected.", 'destructive');
    });
  };

  const openVehicleDialog = () => {
    setNewVehicleModalProps({
        onSave: handleVehicleSave,
        initialData: {
            vin: formData.vin,
            year: formData.year,
            make: formData.make,
            model: formData.model,
            bodyType: formData.bodyType
        }
    });
    setShowNewVehicleModal(true);
  };

  const handleTechnicianSelect = (technicianId: string) => {
    const technician = technicians.find(t => t.id === technicianId);
    if (technician) {
      updateForm('technicianId', technician.id);
      updateForm('technicianName', technician.name);
    }
  };

  const commonProps = {
    job,
    navigationParams,
    formData,
    selectedCustomer,
    setSelectedCustomer,
    customerSearchTerm,
    setCustomerSearchTerm,
    showCustomerSuggestions,
    setShowCustomerSuggestions,
    customerSuggestions,
    isNewJob,
    jobIdSettingsLoading,
    technicians,
    salesTaxRate,
    subtotal,
    discountAmount,
    tax,
    total,
    navigateTo,
    updateForm,
    handleFormChange,
    handleCustomerSelect,
    handleItemSave,
    handleRemoveItem,
    openAddItemModal,
    handleOpenNewCustomerModal,
    handleEditCustomer,
    handleScheduleSave,
    handleFinalSave,
    handleArchiveJob,
    handlePreviewWorkOrder,
    openVehicleDialog,
    handleTechnicianSelect,
    handleCompleteJob,
    saveJob,
    handleCollectPayment,
    handleRevertPayment,
    handleCopyJob,
    handleUnschedule,
  };

  return isMobile ? <JobDetailMobile {...commonProps} /> : <JobDetailWeb {...commonProps} />;
}
