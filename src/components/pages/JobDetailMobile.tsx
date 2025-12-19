
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, CalendarIcon, Save, Eye, User, Car, Wrench, FileText, X, Edit, Archive, CheckCircle, MoreVertical, Navigation, Phone, RotateCcw, Banknote, Copy, CalendarX, Package } from 'lucide-react';
import type { Job, Customer, JobItem } from '@/lib/types';
import { format } from 'date-fns';
import { formatDateTime } from '@/lib/dates';
import { useAppContext } from '@/hooks/useAppContext';
import { cn } from '@/lib/utils';
import { Carousel, CarouselContent, CarouselItem, useCarousel } from '@/components/ui/carousel';

type MobileSection = 'customer' | 'vehicle' | 'parts' | 'notes';

const sections: MobileSection[] = ['customer', 'vehicle', 'parts', 'notes'];

export function JobDetailMobile(props: any) {
  const {
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
    technicians,
    salesTaxRate,
    subtotal,
    discountAmount,
    tax,
    total,
    navigateTo,
    updateForm,
    handleCustomerSelect,
    handleItemSave,
    handleRemoveItem,
    openAddItemModal,
    handleOpenNewCustomerModal,
    handleEditCustomer,
    handleScheduleSave,
    handleArchiveJob,
    handlePreviewWorkOrder,
    openVehicleDialog,
    handleTechnicianSelect,
    handleCompleteJob,
    handleFinalSave,
    handleCollectPayment,
    handleRevertPayment,
    handleCopyJob,
    handleUnschedule,
  } = props;
  
  const { setShowDateTimePickerModal, setDateTimePickerModalProps } = useAppContext();
  const [activeSection, setActiveSection] = useState<MobileSection>('customer');
  const [api, setApi] = useState<any>(null);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const selectedIndex = api.selectedScrollSnap();
      setActiveSection(sections[selectedIndex]);
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  const scrollToSection = (section: MobileSection) => {
    const index = sections.indexOf(section);
    if (api && index !== -1) {
      api.scrollTo(index);
    }
    setActiveSection(section);
  };


  const navItems: { section: MobileSection; label: string; icon: React.ElementType }[] = [
    { section: 'customer', label: 'Customer', icon: User },
    { section: 'vehicle', label: 'Vehicle', icon: Car },
    { section: 'parts', label: 'Parts', icon: Wrench },
    { section: 'notes', label: 'Notes', icon: FileText },
  ];

  const renderActions = () => {
    const completedStatuses: Job['status'][] = ['completed', 'billed', 'partially-paid', 'paid'];
    const isCompleted = completedStatuses.includes(formData.status);
    const isPaid = ['partially-paid', 'paid'].includes(formData.status);

    return (
      <>
        <DropdownMenuItem onClick={handleFinalSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleCompleteJob}>
          {isCompleted ? <RotateCcw className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {isCompleted ? 'Revert Completion' : 'Complete Job'}
        </DropdownMenuItem>
        
        {isCompleted && !isPaid && (
            <DropdownMenuItem onClick={handleCollectPayment}>
              <Banknote className="mr-2 h-4 w-4 text-green-600" /> Collect $
            </DropdownMenuItem>
        )}

        {isPaid && (
            <DropdownMenuItem onClick={handleRevertPayment}>
                <RotateCcw className="mr-2 h-4 w-4" /> Revert Payment
            </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handlePreviewWorkOrder}>
          <Eye className="mr-2 h-4 w-4" />
          Preview Work Order
        </DropdownMenuItem>
        
        {!isNewJob && (
          <DropdownMenuItem onClick={handleCopyJob}>
            <Copy className="mr-2 h-4 w-4" />
            Copy to New Work Order
          </DropdownMenuItem>
        )}
        
        {!isNewJob && (
          <DropdownMenuItem onClick={handleArchiveJob} className="text-destructive">
            <Archive className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        )}
      </>
    );
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {isNewJob ? `New ${navigationParams?.isQuote ? 'Quote' : 'Work Order'}` : `Edit ${formData.isQuote ? 'Quote' : 'Work Order'}`}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isNewJob ? "Fill out details below." : `ID: ${formData.jobId || '...'}`}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateTo('jobs')} className="flex-shrink-0">
            <X className="h-5 w-5"/>
        </Button>
      </div>

       <Carousel setApi={setApi} className="w-full" opts={{ align: "start", loop: false }}>
        <CarouselContent className="-ml-2">
          <CarouselItem className="pl-2">
              <Card>
                <CardHeader className="p-4"><CardTitle>Customer</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                    {selectedCustomer ? (
                      <div className="flex flex-col gap-2 p-3 border rounded-lg bg-secondary/50">
                        <p className="font-medium">{selectedCustomer.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone} | {selectedCustomer.email || "N/A"}</p>
                        {selectedCustomer.address && (
                            <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                        )}
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <div className="flex items-center gap-2">
                                <Button
                                variant="ghost" size="sm" className="w-fit text-blue-500 hover:text-blue-600"
                                onClick={handleEditCustomer}
                                >
                                <Edit className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                variant="ghost" size="sm" className="w-fit text-red-500 hover:text-red-600"
                                onClick={() => {
                                    setSelectedCustomer(null);
                                    updateForm('customerId', '');
                                    updateForm('customerName', '');
                                    setCustomerSearchTerm("");
                                }}
                                >
                                <X className="h-3 w-3 mr-1" /> Clear
                                </Button>
                            </div>
                            <div className="flex items-center gap-4">
                                <a href={`tel:${selectedCustomer.phone}`}>
                                    <Phone className="h-5 w-5 text-blue-500 hover:text-blue-700"/>
                                </a>
                                {selectedCustomer.address && (
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedCustomer.address || '')}`} target="_blank" rel="noopener noreferrer">
                                        <Navigation className="h-5 w-5 text-blue-500 hover:text-blue-700"/>
                                    </a>
                                )}
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative space-y-2">
                          <Label htmlFor="customer-search">Search</Label>
                          <Input
                            id="customer-search"
                            placeholder="Name or phone..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            onFocus={() => setShowCustomerSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                          />
                          {showCustomerSuggestions && customerSuggestions.length > 0 && (
                            <div className='absolute z-20 w-full bg-background border shadow-lg rounded-md mt-1 max-h-48 overflow-y-auto'>
                              {customerSuggestions.map((c: Customer) => (
                                <div key={c.id} onMouseDown={() => handleCustomerSelect(c)} className='p-2 cursor-pointer hover:bg-muted'>
                                  <p className='font-semibold'>{c.name}</p>
                                  <p className='text-sm text-muted-foreground'>{c.phone}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleOpenNewCustomerModal}>
                          <User className="mr-2 h-4 w-4"/> New Customer
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
          </CarouselItem>
          <CarouselItem className="pl-2">
             <Card>
                <CardHeader className="p-4"><CardTitle>Vehicle</CardTitle></CardHeader>
                <CardContent className="p-4 pt-0">
                  {formData.make && formData.year && formData.model ? (
                    <div className="space-y-2">
                      <div className="flex flex-col gap-2 p-3 border rounded-lg bg-secondary/50">
                          <p><span className="font-medium">Year:</span> {formData.year}</p>
                          <p><span className="font-medium">Make:</span> {formData.make}</p>
                          <p><span className="font-medium">Model:</span> {formData.model}</p>
                          {formData.bodyType && <p><span className="font-medium">Type:</span> {formData.bodyType}</p>}
                          <p><span className="font-medium">VIN:</span> {formData.vin || 'Not Entered'}</p>
                          <Button variant="ghost" size="sm" className="w-fit text-blue-500 hover:text-blue-600 mt-2" onClick={openVehicleDialog}>
                              <Edit className="h-3 w-3 mr-1" /> Edit Vehicle
                          </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={openVehicleDialog} className="w-full">
                      <Car className="mr-2 h-4 w-4" /> Add Vehicle
                    </Button>
                  )}
                </CardContent>
              </Card>
          </CarouselItem>
          <CarouselItem className="pl-2">
            <Card>
                <CardHeader className="p-4">
                    <div className="flex justify-between items-center">
                        <CardTitle>Parts &amp; Pricing</CardTitle>
                        <Button size="sm" onClick={() => openAddItemModal(null, null)}>
                            <Plus className="mr-2 h-4 w-4"/> Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  {(formData.jobItems || []).map((item: JobItem, index: number) => {
                      const itemTotal = (item.quantity || 0) * (item.price || 0);
                      let itemDiscount = 0;
                      if (item.discountType === '%') itemDiscount = itemTotal * ((item.discountValue || 0) / 100);
                      else itemDiscount = (item.discountValue || 0) * (item.quantity || 1);
                      return (
                        <Card key={index} className="bg-muted/50">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <p className="font-medium pr-2">{item.description}</p>
                              <div className="flex">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddItemModal(item, index)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <p>Qty: {item.quantity}</p>
                              <p>Price: ${(item.price || 0).toFixed(2)}</p>
                              <p>Disc: ${itemDiscount.toFixed(2)}</p>
                              <p className="font-semibold">Total: ${(itemTotal - itemDiscount).toFixed(2)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  <div className="w-full space-y-2 pt-4 border-t">
                      <div className="flex justify-between items-center"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                      {discountAmount > 0 && (<div className="flex justify-between items-center text-sm text-muted-foreground"><span>Discount:</span><span>- ${discountAmount.toFixed(2)}</span></div>)}
                      <div className="flex justify-between items-center"><span>Tax ({salesTaxRate}%):</span> <span>${tax.toFixed(2)}</span></div>
                      <Separator/>
                      <div className="font-bold text-lg flex items-center justify-between"><span>Grand Total:</span><span>${total.toFixed(2)}</span></div>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="applySalesTax-mobile" name="applySalesTax" checked={!!formData.applySalesTax} onCheckedChange={c => updateForm('applySalesTax', !!c)}/>
                        <Label htmlFor="applySalesTax-mobile">Apply Sales Tax</Label>
                      </div>
                  </div>
                </CardContent>
              </Card>
          </CarouselItem>
          <CarouselItem className="pl-2">
            <Card>
              <CardHeader className="p-4"><CardTitle>Scheduling, Status &amp; Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4 p-4 pt-0">
                 {
                    formData.scheduledDate ? (
                        <div className="flex flex-col gap-2">
                            <div className="text-sm space-y-1">
                              <p><span className="font-medium">Date:</span> {format(new Date(formData.scheduledDate), "MMM dd, yyyy")}</p>
                              <p><span className="font-medium">Time:</span> {formData.scheduledTime}</p>
                              <p><span className="font-medium">Type:</span> {formData.serviceType}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button size="sm" variant="secondary" onClick={() => {
                                    setDateTimePickerModalProps({ onSave: handleScheduleSave, initialDate: formData.scheduledDate, initialTime: formData.scheduledTime, initialServiceType: formData.serviceType as 'In-Shop' | 'Mobile' });
                                    setShowDateTimePickerModal(true);
                                }}>
                                <CalendarIcon className="mr-2 h-4 w-4" /> Reschedule
                                </Button>
                                <Button size="sm" variant="destructive" onClick={handleUnschedule}>
                                <CalendarX className="mr-2 h-4 w-4" /> Unschedule
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button variant="outline" className="w-full" onClick={() => {
                            setDateTimePickerModalProps({ onSave: handleScheduleSave, jobToReschedule: null, initialDate: new Date() });
                            setShowDateTimePickerModal(true)
                        }}>
                          <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Job
                        </Button>
                    )
                 }
                 <div>
                    <Label>Assign Technician</Label>
                    <Select value={formData.technicianId} onValueChange={handleTechnicianSelect}>
                        <SelectTrigger><SelectValue placeholder="Select a technician..." /></SelectTrigger>
                        <SelectContent>
                        {technicians.map((tech: any) => (<SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                    </div>
                  <Separator />
                  
                  {['paid', 'partially-paid'].includes(formData.status) ? (
                    <div className="p-3 border rounded-lg bg-green-50 text-green-800">
                      <p className="font-bold">Payment Recorded</p>
                      <p>Amount: ${(formData.amountPaid || 0).toFixed(2)}</p>
                      <p>Type: {formData.paymentType}</p>
                      <p>Date: {formData.paymentDate ? formatDateTime(formData.paymentDate) : 'N/A'}</p>
                    </div>
                  ) : (
                    <div>
                      <Label>Job Status</Label>
                      <p className="text-sm font-bold capitalize p-2 bg-muted rounded-md">{formData.status}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                      <Label>Internal Notes</Label>
                      <Textarea name="notes" placeholder="Internal notes for this job..." value={formData.notes || ''} onChange={e => updateForm('notes', e.target.value)} rows={5} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="insuranceClaim-mobile" name="insuranceClaim" checked={!!formData.insuranceClaim} onCheckedChange={c => updateForm('insuranceClaim', !!c)} />
                    <Label htmlFor="insuranceClaim-mobile">Insurance Claim</Label>
                  </div>
                  {formData.insuranceClaim && (
                    <div className="space-y-3 pl-6 border-l-2 ml-3">
                      <div><Label>Insurance Company</Label><Input name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={e => updateForm('insuranceCompany', e.target.value)} /></div>
                      <div><Label>Deductible</Label><Input type="number" name="deductible" value={formData.deductible || 0} onChange={e => updateForm('deductible', parseFloat(e.target.value))} /></div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>
      </Carousel>


      {/* --- BOTTOM NAVIGATION & ACTIONS --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-30">
        <div className="grid grid-cols-5 items-center">
            {navItems.map(({section, label, icon: Icon}) => (
                <button key={section} onClick={() => scrollToSection(section)} className={cn("flex flex-col items-center justify-center p-2 text-xs text-muted-foreground border-r", activeSection === section && "bg-accent text-accent-foreground")}>
                    <Icon className="h-5 w-5 mb-1" />
                    <span>{label}</span>
                </button>
            ))}
            <div className="flex items-center justify-center p-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex-col h-full text-xs p-2">
                            <MoreVertical className="h-5 w-5 mb-1" />
                            Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="mb-2">
                        {renderActions()}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>
    </div>
  );
}
