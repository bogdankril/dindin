
"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, CalendarIcon, Save, Eye, UserPlus, Car, Search, X, Edit, Archive, CheckCircle, Navigation, Phone, RotateCcw, Banknote, Copy, CalendarX, Package } from 'lucide-react';
import type { Job, Customer, JobItem, ItemCode, JobStatus, InventoryItem } from '@/lib/types';
import { format } from 'date-fns';
import { formatDateTime } from '@/lib/dates';
import { useAppContext } from '@/hooks/useAppContext';
import { Switch } from '@/components/ui/switch';


export default function JobDetailWeb(props: any) {
  const {
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
    handleCollectPayment,
    handleRevertPayment,
    handleCopyJob,
    handleUnschedule,
  } = props;
  
  const {
    setShowDateTimePickerModal,
    setDateTimePickerModalProps,
  } = useAppContext();

  const amountPaid = formData.amountPaid || 0;
  const amountDue = total - amountPaid;

  const renderActionButtons = () => {
    const completedStatuses: Job['status'][] = ['completed', 'billed', 'partially-paid', 'paid'];
    const isCompleted = completedStatuses.includes(formData.status);
    const isPaid = ['partially-paid', 'paid'].includes(formData.status);
    const isSaveDisabled = isNewJob && jobIdSettingsLoading;
  
    return (
      <div className="flex justify-end items-center mt-6 gap-2">
        <Button variant="outline" onClick={() => navigateTo('jobs')}>Cancel</Button>
        {!isNewJob && (
          <Button variant="outline" onClick={handleCopyJob}>
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
        )}
        {!isNewJob && (
          <Button variant="destructive" onClick={handleArchiveJob}>
            <Archive className="mr-2 h-4 w-4"/> Archive
          </Button>
        )}
        <Button variant="secondary" onClick={handlePreviewWorkOrder} disabled={isSaveDisabled}>
          <Eye className="mr-2 h-4 w-4"/> Preview
        </Button>
        <Button onClick={handleCompleteJob}>
          {isCompleted ? <RotateCcw className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
          {isCompleted ? 'Revert Completion' : 'Mark as Complete'}
        </Button>

        {isPaid ? (
            <Button variant="secondary" onClick={handleRevertPayment}>
              <RotateCcw className="mr-2 h-4 w-4"/> Revert Payment
            </Button>
        ) : isCompleted && (
            <Button onClick={handleCollectPayment} className="bg-green-600 hover:bg-green-700">
              <Banknote className="mr-2 h-4 w-4" /> Collect $
            </Button>
        )}
         <Button onClick={handleFinalSave} disabled={isSaveDisabled}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isNewJob ? `New ${formData.isQuote ? 'Quote' : 'Work Order'}` : `Edit ${formData.isQuote ? 'Quote' : 'Work Order'}`}
          </h2>
          <p className="text-muted-foreground">
            {isNewJob ? "Fill out the details to create a new job." : `Editing ID: ${formData.jobId || formData.id?.substring(0,6) || '...'}`}
          </p>
        </div>
         <div className="flex items-center space-x-2">
          <Label htmlFor="isQuoteSwitch" className={formData.isQuote ? 'text-muted-foreground' : ''}>Work Order</Label>
          <Switch
            id="isQuoteSwitch"
            checked={formData.isQuote || false}
            onCheckedChange={(checked) => updateForm('isQuote', checked)}
            aria-label="Toggle between Work Order and Quote"
          />
          <Label htmlFor="isQuoteSwitch" className={!formData.isQuote ? 'text-muted-foreground' : ''}>Quote</Label>
        </div>
      </div>
      
       <div className="space-y-6">
            {/* --- CUSTOMER CARD --- */}
            <Card>
                <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
                <CardContent>
                    {selectedCustomer ? (
                      <div className="flex flex-wrap justify-between items-center gap-4 p-3 border rounded-lg bg-secondary/50">
                          <div>
                            <p className="font-medium">{selectedCustomer.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedCustomer.phone} | {selectedCustomer.email || "N/A"}</p>
                            {selectedCustomer.address && (
                                <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>
                            )}
                          </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600" onClick={handleEditCustomer}>
                                <Edit className="h-3 w-3 mr-1" /> Edit
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => { setSelectedCustomer(null); updateForm('customerId', ''); updateForm('customerName', ''); setCustomerSearchTerm(''); }}>
                                <X className="h-3 w-3 mr-1" /> Clear
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={`tel:${selectedCustomer.phone}`}>
                                    <Phone className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                                </a>
                            </Button>
                             {selectedCustomer.address && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedCustomer.address || '')}`} target="_blank" rel="noopener noreferrer">
                                      <Navigation className="h-4 w-4 text-blue-500 hover:text-blue-700"/>
                                  </a>
                                </Button>
                             )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative space-y-2">
                          <Label htmlFor="customer-search">Search Customer</Label>
                          <Input
                            id="customer-search"
                            placeholder="Type name or phone..."
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
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleOpenNewCustomerModal}
                        >
                          <UserPlus className="mr-2 h-4 w-4"/>
                          Add New Customer
                        </Button>
                      </div>
                    )}
                </CardContent>
            </Card>

            {/* --- VEHICLE CARD --- */}
            <Card>
              <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
              <CardContent>
                {formData.make && formData.year && formData.model ? (
                  <div className="space-y-2">
                    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-secondary/50">
                        <p><span className="font-medium">Year:</span> {formData.year}</p>
                        <p><span className="font-medium">Make:</span> {formData.make}</p>
                        <p><span className="font-medium">Model:</span> {formData.model}</p>
                        {formData.bodyType && <p><span className="font-medium">Type:</span> {formData.bodyType}</p>}
                        <p><span className="font-medium">VIN:</span> {formData.vin || 'Not Entered'}</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-fit text-blue-500 hover:text-blue-600 mt-2"
                            onClick={openVehicleDialog}
                        >
                            <Edit className="h-3 w-3 mr-1" /> Edit Vehicle
                        </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={openVehicleDialog}
                    className="w-full"
                  >
                    <Car className="mr-2 h-4 w-4" /> Add Vehicle Details
                  </Button>
                )}
              </CardContent>
            </Card>
            {/* --- JOB STATUS & DETAILS --- */}
            <Card>
              <CardHeader>
                <CardTitle>Job Status &amp; Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Scheduling</Label>
                    {
                      formData.scheduledDate ? (
                        <div className="p-3 border rounded-md bg-muted flex flex-col justify-between h-full">
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Date:</span> {format(new Date(formData.scheduledDate), "MMM dd, yyyy")}</p>
                            <p><span className="font-medium">Time:</span> {formData.scheduledTime}</p>
                            <p><span className="font-medium">Type:</span> {formData.serviceType}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
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
                        <Button variant="outline" className="w-full h-full" onClick={() => {
                            setDateTimePickerModalProps({ onSave: handleScheduleSave, jobToReschedule: null, initialDate: new Date() });
                            setShowDateTimePickerModal(true)
                        }}>
                          <CalendarIcon className="mr-2 h-4 w-4" /> Select Date &amp; Time
                        </Button>
                      )
                    }
                  </div>
                  <div className="space-y-2">
                    <Label>Assignment</Label>
                    <Select value={formData.technicianId} onValueChange={handleTechnicianSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a technician..." />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians.map((tech: any) => (<SelectItem key={tech.id} value={tech.id}>{tech.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="poNumber">P.O. Number</Label>
                      <Input id="poNumber" name="poNumber" value={formData.poNumber || ''} onChange={handleFormChange}/>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                      <Label>Internal Notes</Label>
                      <Textarea name="notes" placeholder="Notes about the job..." value={formData.notes || ''} onChange={handleFormChange} rows={3} />
                  </div>
                  <div className="flex items-center space-x-2">
                      <Checkbox id="insuranceClaim" name="insuranceClaim" checked={!!formData.insuranceClaim} onCheckedChange={(checked) => updateForm('insuranceClaim', !!checked)} />
                      <Label htmlFor="insuranceClaim" className="font-medium">Is this an insurance claim?</Label>
                  </div>
                  {formData.insuranceClaim && (
                      <div className="space-y-3 pl-6 border-l-2 ml-3">
                        <div><Label>Insurance Company</Label><Input name="insuranceCompany" value={formData.insuranceCompany || ''} onChange={(e) => updateForm('insuranceCompany', e.target.value)} /></div>
                        <div><Label>Deductible</Label><Input type="number" name="deductible" value={formData.deductible || 0} onChange={(e) => updateForm('deductible', parseFloat(e.target.value))} /></div>
                      </div>
                  )}
                </div>
              </CardContent>
            </Card>
           {/* --- JOB ITEMS & PRICING --- */}
          <Card>
              <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Job Items &amp; Pricing</CardTitle>
                    <Button onClick={() => openAddItemModal(null, null)}>
                        <Plus className="mr-2 h-4 w-4"/> Add Item
                    </Button>
                  </div>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(formData.jobItems || []).length === 0 ? (
                      <div className="text-center text-muted-foreground p-4 border rounded-md">No items added yet.</div>
                    ) : (
                      (formData.jobItems || []).map((item: JobItem, index: number) => {
                        const itemTotal = (item.quantity || 0) * (item.price || 0);
                        let itemDiscount = 0;
                        if (item.discountType === '%') {
                          itemDiscount = itemTotal * ((item.discountValue || 0) / 100);
                        } else {
                          itemDiscount = (item.discountValue || 0) * (item.quantity || 1);
                        }
                        return (
                          <Card key={index} className="bg-muted/50">
                            <CardContent className="p-3 flex items-center justify-between gap-4">
                              <div className="flex-grow">
                                <p className="font-medium">{item.description}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} x ${(item.price || 0).toFixed(2)} 
                                  {item.discountValue ? ` (Disc: $${itemDiscount.toFixed(2)})` : ''}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <p className="font-semibold text-right">${(itemTotal - itemDiscount).toFixed(2)}</p>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAddItemModal(item, index)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveItem(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-4">
                        
                        {['paid', 'partially-paid'].includes(formData.status) && (
                            <div className="p-2 border rounded-lg bg-green-50 text-green-800 text-sm">
                                <p className="font-bold">Payment Recorded:</p>
                                <p>${(formData.amountPaid || 0).toFixed(2)} via {formData.paymentType} on {formatDateTime(formData.paymentDate)}</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full space-y-2 self-end">
                        <div className="flex justify-between items-center"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                        {discountAmount > 0 && (<div className="flex justify-between items-center text-sm text-muted-foreground"><span>Discount:</span><span>- ${discountAmount.toFixed(2)}</span></div>)}
                        <div className="flex justify-between items-center"><span>Tax ({salesTaxRate}%):</span> <span>${tax.toFixed(2)}</span></div>
                        <Separator/>
                        <div className="font-semibold text-base flex items-center justify-between"><span>Grand Total:</span><span>${total.toFixed(2)}</span></div>
                        {amountPaid > 0 && (<div className="flex justify-between items-center text-sm text-destructive"><span>Amount Paid:</span><span>- ${(amountPaid).toFixed(2)}</span></div>)}
                        <Separator/>
                        <div className="font-bold text-lg flex items-center justify-between text-primary"><span>Amount Due:</span><span>${amountDue.toFixed(2)}</span></div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="applySalesTax" name="applySalesTax" checked={!!formData.applySalesTax} onCheckedChange={c => updateForm('applySalesTax', !!c)} />
                            <Label htmlFor="applySalesTax">Apply Sales Tax to Job</Label>
                        </div>
                    </div>
                  </div>
              </CardContent>
          </Card>
        </div>
      
      {/* --- ACTIONS --- */}
      <div className="border-t pt-6 mt-6">
        {renderActionButtons()}
      </div>
    </div>
  );
}
