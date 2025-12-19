
"use client";

import { useState, useRef, type RefObject, useEffect } from 'react';
import type { Job, Customer, BusinessProfile, ThemeSettings } from "@/lib/types";
import { formatDateTime } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { sendWorkOrderEmail } from '@/ai/flows/send-work-order-email';
import { Loader2, Printer, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAppContext } from '@/hooks/useAppContext';
import { Skeleton } from '../ui/skeleton';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { doc, onSnapshot } from 'firebase/firestore';

// Simplistic Template Component
const SimplisticTemplate = ({ job, customer, companyProfile, salesTaxRate }: any) => {
    const { subtotal, discountAmount, tax, total, amountPaid, amountDue } = calculateTotals(job, salesTaxRate);
    const jobIdNumber = job.jobId || job.id.substring(0, 6);
    
    return (
        <div className="preview-container font-sans text-sm max-w-4xl mx-auto p-8 bg-white text-black">
            <div className="flex justify-between items-start mb-6 pb-4 border-b">
                <div className="w-2/3">
                    {companyProfile.logoUrl && (
                        <div className="w-32 h-auto mb-4">
                            <img src={companyProfile.logoUrl} alt={`${companyProfile.name} Logo`} className="w-full h-auto object-contain" />
                        </div>
                    )}
                    <h3 className="text-2xl font-bold">{companyProfile.name}</h3>
                    <p className="text-gray-500">{companyProfile.address}</p>
                    <p className="text-gray-500">{companyProfile.phone} | {companyProfile.email}</p>
                </div>
                <div className="w-1/3 text-right">
                    <h2 className="text-3xl font-bold uppercase text-primary">{job.isQuote ? "Quote" : "Work Order"}</h2>
                    <p className="text-gray-500">{jobIdNumber}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-xs mb-2">Billed To</h4>
                    <p className="font-medium">{customer.name}</p>
                    <p>{customer.address}</p>
                    <p>{customer.phone}</p>
                </div>
                <div className="text-right">
                     <p><span className="font-semibold">Date:</span> {formatDateTime(job.createdAt)}</p>
                     {job.scheduledDate && <p><span className="font-semibold">Service Date:</span> {job.scheduledDate}</p>}
                </div>
            </div>
            
             <table className="w-full text-left mb-8">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 font-semibold">Description</th>
                        <th className="p-2 font-semibold text-right">Quantity</th>
                        <th className="p-2 font-semibold text-right">Unit Price</th>
                        <th className="p-2 font-semibold text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(job.jobItems || []).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">${item.price.toFixed(2)}</td>
                            <td className="p-2 text-right">${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>Tax:</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                     {amountPaid > 0 && <div className="flex justify-between text-red-600"><span>Amount Paid:</span><span>-${amountPaid.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-black mt-2"><span>Amount Due:</span><span>${amountDue.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    );
};

// Modern Template Component
const ModernTemplate = ({ job, customer, companyProfile, salesTaxRate }: any) => {
    const { subtotal, discountAmount, tax, total, amountPaid, amountDue } = calculateTotals(job, salesTaxRate);
    const jobIdNumber = job.jobId || job.id.substring(0, 6);
    
    return (
        <div className="preview-container font-sans text-sm max-w-4xl mx-auto p-8 bg-white text-black">
            <header className="flex justify-between items-center mb-10">
                {companyProfile.logoUrl ? (
                    <div className="w-32 h-auto">
                        <img src={companyProfile.logoUrl} alt={`${companyProfile.name} Logo`} className="w-full h-auto object-contain"/>
                    </div>
                ) : <div />}
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-primary uppercase">{job.isQuote ? 'Quote' : 'Work Order'}</h2>
                    <p className="text-muted-foreground">{jobIdNumber}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-8 mb-10">
                <div>
                    <h4 className="font-semibold text-primary mb-2">Billed To</h4>
                    <p className="font-bold text-lg">{customer.name}</p>
                    <p>{customer.address}</p>
                    <p>{customer.phone} | {customer.email}</p>
                </div>
                <div className="text-right space-y-1">
                    <p><strong className="text-muted-foreground">Date:</strong> {formatDateTime(job.createdAt)}</p>
                    {job.scheduledDate && <p><strong className="text-muted-foreground">Service Date:</strong> {job.scheduledDate}</p>}
                    <p><strong className="text-muted-foreground">Vehicle:</strong> {job.year} {job.make} {job.model}</p>
                    {job.vin && <p><strong className="text-muted-foreground">VIN:</strong> {job.vin}</p>}
                </div>
            </section>

            <section>
                 <table className="w-full text-left mb-8">
                    <thead>
                        <tr className="bg-primary text-primary-foreground">
                            <th className="p-3 rounded-l-lg font-semibold">Description</th>
                            <th className="p-3 font-semibold text-center">Qty</th>
                            <th className="p-3 font-semibold text-right">Unit Price</th>
                            <th className="p-3 rounded-r-lg font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(job.jobItems || []).map((item: any, index: number) => (
                            <tr key={index} className="border-b">
                                <td className="p-3">{item.description}</td>
                                <td className="p-3 text-center">{item.quantity}</td>
                                <td className="p-3 text-right">${(item.price || 0).toFixed(2)}</td>
                                <td className="p-3 text-right">${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <section className="flex justify-between items-start">
                <div className="w-1/2">
                    <h5 className="font-semibold text-primary mb-2">Notes</h5>
                    <p className="text-muted-foreground text-xs pr-4">{job.notes || "No notes for this job."}</p>
                </div>
                 <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && (<div className="flex justify-between text-sm text-gray-500"><span>Discount:</span><span className="font-medium">- ${discountAmount.toFixed(2)}</span></div>)}
                    <div className="flex justify-between"><span>Tax ({salesTaxRate}%):</span><span className="font-medium">${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between pt-2 border-t text-lg font-bold"><span>Grand Total:</span><span>${total.toFixed(2)}</span></div>
                    {amountPaid > 0 && (<div className="flex justify-between text-sm text-red-600"><span>Amount Paid:</span><span>- ${amountPaid.toFixed(2)}</span></div>)}
                    <div className="flex justify-between pt-2 border-t-2 border-primary text-xl font-bold text-primary bg-primary/10 p-2 rounded-lg"><span>Amount Due:</span><span>${amountDue.toFixed(2)}</span></div>
                  </div>
            </section>
        </div>
    );
};

// Informative Template Component
const InformativeTemplate = ({ job, customer, companyProfile, salesTaxRate }: any) => {
    const { subtotal, discountAmount, tax, total, amountPaid, amountDue } = calculateTotals(job, salesTaxRate);
    const jobIdNumber = job.jobId || job.id.substring(0, 6);

    return (
         <div className="preview-container font-sans text-sm max-w-4xl mx-auto p-8 bg-white text-black">
            {/* Header */}
            <div className="text-center mb-8">
                {companyProfile.logoUrl && (
                    <img src={companyProfile.logoUrl} alt="Company Logo" className="w-24 h-auto mx-auto mb-4"/>
                )}
                <h2 className="text-3xl font-bold">{companyProfile.name}</h2>
                <p className="text-gray-500">{companyProfile.address} | {companyProfile.phone} | {companyProfile.email}</p>
                <h3 className="text-2xl font-semibold mt-4 border-y-2 border-primary text-primary py-2">{job.isQuote ? 'Quote' : 'Work Order'}</h3>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-xs">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1">Customer</h4>
                    <p>{customer.name}</p>
                    <p>{customer.phone}</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1">Vehicle</h4>
                    <p>{job.year} {job.make} {job.model}</p>
                    <p>VIN: {job.vin || 'N/A'}</p>
                </div>
                 <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-bold mb-1">Details</h4>
                    <p>ID: {jobIdNumber}</p>
                    <p>Date: {formatDateTime(job.createdAt)}</p>
                </div>
            </div>

            {/* Line Items */}
            <h4 className="font-bold text-lg mb-2">Items</h4>
             <table className="w-full text-left mb-8">
                <thead className="border-b-2 border-black">
                    <tr>
                        <th className="p-2 font-bold">Description</th>
                        <th className="p-2 font-bold text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {(job.jobItems || []).map((item: any, index: number) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">
                                {item.description}
                                <p className="text-gray-500 text-xs">{item.quantity} x ${(item.price || 0).toFixed(2)}</p>
                            </td>
                            <td className="p-2 text-right font-medium">${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Total and Notes */}
            <div className="grid grid-cols-2 gap-8">
                <div>
                     <h4 className="font-bold text-lg mb-2">Notes</h4>
                     <p className="text-gray-600 text-xs">{job.notes || 'No notes.'}</p>
                </div>
                 <div className="w-full space-y-2">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                    {discountAmount > 0 && <div className="flex justify-between"><span>Discount:</span><span>-${discountAmount.toFixed(2)}</span></div>}
                    <div className="flex justify-between"><span>Tax:</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-xl py-2 border-y-2 border-black my-2"><span>Total:</span><span>${total.toFixed(2)}</span></div>
                     {amountPaid > 0 && <div className="flex justify-between text-red-600"><span>Amount Paid:</span><span>-${amountPaid.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-bold text-lg"><span>Amount Due:</span><span>${amountDue.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    );
};

const templateComponents = {
  simplistic: SimplisticTemplate,
  modern: ModernTemplate,
  informative: InformativeTemplate,
};

const calculateTotals = (job: Job, salesTaxRate: number) => {
    let subtotal = 0;
    let totalDiscount = 0;
    (job.jobItems || []).forEach(item => {
        const itemTotal = (item.quantity || 0) * (item.price || 0);
        subtotal += itemTotal;
        let itemDiscount = 0;
        if (item.discountType === '%') {
            itemDiscount = itemTotal * ((item.discountValue || 0) / 100);
        } else {
            itemDiscount = (item.discountValue || 0) * (item.quantity || 1);
        }
        totalDiscount += itemDiscount;
    });
    const subtotalAfterDiscount = subtotal - totalDiscount;
    const tax = job.applySalesTax ? subtotalAfterDiscount * (salesTaxRate / 100) : 0;
    const total = subtotalAfterDiscount + tax;
    const amountPaid = job.amountPaid || 0;
    const amountDue = total - amountPaid;
    return { subtotal, discountAmount: totalDiscount, tax, total, amountPaid, amountDue };
};


interface WorkOrderPreviewDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  customer: Customer;
  companyProfile: BusinessProfile;
  salesTaxRate: number;
}

export default function WorkOrderPreviewDialog({
  isOpen,
  onOpenChange,
  job,
  customer,
  companyProfile,
  salesTaxRate,
}: WorkOrderPreviewDialogProps) {
  const { userProfile, theme, db } = useAppContext();
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [templateSettings, setTemplateSettings] = useState<ThemeSettings>({ template: 'modern'});
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [emailToSend, setEmailToSend] = useState('');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  useEffect(() => {
    if (!isOpen || !db || !userProfile?.id) return;

    setLoadingTemplate(true);
    setEmailToSend(customer?.email || '');

    const settingsRef = doc(db, 'users', userProfile.id, 'settings', 'theme');
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setTemplateSettings(doc.data() as ThemeSettings);
        }
        setLoadingTemplate(false);
    }, () => setLoadingTemplate(false));

    return () => unsubscribe();
  }, [isOpen, customer, db, userProfile?.id]);


  if (!job || !customer || !companyProfile) {
    return null;
  }

  const documentType = job.isQuote ? "Quote" : "Work Order";
  
  const generatePdf = async (elementRef: RefObject<HTMLDivElement>) => {
    const input = elementRef.current;
    if (!input) return null;

    try {
        const canvas = await html2canvas(input, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let newCanvasWidth = pdfWidth;
        let newCanvasHeight = pdfWidth / ratio;
        
        if (newCanvasHeight > pdfHeight) {
            newCanvasHeight = pdfHeight;
            newCanvasWidth = pdfHeight * ratio;
        }

        const xOffset = (pdfWidth - newCanvasWidth) / 2;
        const yOffset = (pdfHeight - newCanvasHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, newCanvasWidth, newCanvasHeight);
        return pdf.output('datauristring').split(',')[1];
    } catch(error) {
        console.error("Error generating PDF", error);
        toast({
            variant: "destructive",
            title: "PDF Generation Failed",
            description: "There was an error creating the PDF for the email attachment.",
        });
        return null;
    }
  };


  const handlePrint = async () => {
    const pdfBase64 = await generatePdf(printRef);
    if (!pdfBase64) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        variant: "destructive",
        title: "Print Error",
        description: "Please allow pop-ups for printing.",
      });
      return;
    }
    const blob = new Blob([Buffer.from(pdfBase64, 'base64')], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    printWindow.location.href = url;
  };
  
  const handleEmailToCustomer = async () => {
    if (!emailToSend) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "Please enter an email address to send this document to.",
      });
      return;
    }

    setIsSendingEmail(true);
    setShowEmailDialog(false);
    toast({ title: "Generating PDF...", description: "Please wait while the PDF is being created for the email."});

    const pdfBase64 = await generatePdf(printRef);
    if(!pdfBase64) {
      setIsSendingEmail(false);
      return;
    }

    toast({ title: "Sending Email...", description: "The PDF has been generated and the email is now being sent."});

    try {
      const result = await sendWorkOrderEmail({
        customerName: customer.name,
        customerEmail: emailToSend,
        companyName: companyProfile.name,
        documentType: documentType,
        jobId: job.jobId || job.id,
        pdfAttachment: pdfBase64
      });

      if (result.success) {
        toast({ title: "Email Sent", description: result.message });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({
        variant: "destructive",
        title: "Email Failed",
        description: errorMessage,
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const SelectedTemplate = templateComponents[templateSettings?.template || 'modern'];
  
  return (
    <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-none w-full h-full sm:max-w-4xl sm:h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle className="text-2xl">
                    {documentType} Preview
                </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-full w-full border rounded-md bg-gray-200 flex-grow">
                {loadingTemplate ? (
                    <div className="p-8 space-y-4">
                        <Skeleton className="h-20 w-full bg-white" />
                        <Skeleton className="h-40 w-full bg-white" />
                        <Skeleton className="h-64 w-full bg-white" />
                    </div>
                ) : (
                    <div ref={printRef} className={cn('theme-renderer', theme)}>
                        <SelectedTemplate job={job} customer={customer} companyProfile={companyProfile} salesTaxRate={salesTaxRate} />
                    </div>
                )}
            </ScrollArea>
            <DialogFooter className="flex-col sm:flex-row sm:justify-end gap-2 pt-4">
                <Button onClick={handlePrint} variant="outline" size="sm" disabled={isSendingEmail || loadingTemplate}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
                <Button onClick={() => setShowEmailDialog(true)} size="sm" disabled={isSendingEmail || loadingTemplate}>
                  <Mail className="mr-2 h-4 w-4" /> Email to Customer
                </Button>
                <DialogClose asChild>
                    <Button variant="destructive" size="sm">
                        Close
                    </Button>
                </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showEmailDialog && (
            <AlertDialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Email {documentType}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Confirm the recipient's email address below.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="emailToSendDialog">Email Address</Label>
                        <Input
                            id="emailToSendDialog"
                            type="email"
                            value={emailToSend}
                            onChange={(e) => setEmailToSend(e.target.value)}
                            placeholder="customer@email.com"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSendingEmail}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleEmailToCustomer} disabled={isSendingEmail || !emailToSend}>
                            {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Send Email
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
    </>
  );
}
