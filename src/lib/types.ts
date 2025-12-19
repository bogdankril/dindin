

export type UserRole = 'admin' | 'manager' | 'member' | 'technician';

export type JobStatus = 'new' | 'scheduled' | 'completed' | 'billed' | 'partially-paid' | 'paid';
export type PaymentType = 'Cash' | 'Check' | 'Credit Card' | 'Other';


export interface UserProfile {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  technicianId?: string; // Links to the ID in the technicians collection
  createdAt: any;
  updatedAt: any;
}

export interface Customer {
  id:string;
  name: string;
  phone: string;
  email: string;
  address: string;
  isTaxExempt?: boolean;
  taxId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Vehicle {
  id:string;
  vin: string;
  make: string;
  model: string;
  year: string;
  bodyType: string;
  createdAt: any;
  updatedAt: any;
}

export interface Technician {
  id: string;
  userId?: string; // The auth UID of the user
  name: string;
  phone?: string;
  email?: string;
  companyId: string;
  createdAt: any;
  updatedAt: any;
}

export interface JobItem {
  description: string;
  quantity: number;
  price: number;
  discountType?: '$' | '%';
  discountValue?: number;
  inventoryId?: string; // ID of the inventory item used
}

export interface Job {
  id: string;
  jobId: string;
  customerName: string;
  customerId: string;
  vin: string;
  make: string;
  model: string;
  year: string;
  bodyType: string;
  vehicleId: string;
  technicianId?: string;
  technicianName?: string;
  jobItems: JobItem[];
  isQuote: boolean;
  serviceType: 'In-Shop' | 'Mobile';
  scheduledDate: string; // Stored as YYYY-MM-DD
  scheduledTime: string;
  notes: string;
  insuranceClaim: boolean;
  insuranceCompany: string;
  deductible: number;
  applySalesTax: boolean;
  createdAt: any;
  updatedAt: any;
  totalAmount: number;
  archivedAt?: any;
  status: JobStatus;
  // New Payment Fields
  amountPaid?: number;
  paymentType?: PaymentType | null;
  paymentDate?: any;
  paymentNotes?: string;
  poNumber?: string;
}

export interface InventoryItem {
    id: string;
    partNumber: string;
    description: string;
    quantity: number;
    cost: number;
    price: number;
    createdAt: any;
    updatedAt: any;
}

export interface BusinessProfile {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl?: string;
    createdAt: any;
    updatedAt: any;
    colorScheme?: ColorScheme;
}

export interface ItemCode {
    id: string;
    code: string;
    description: string;
    price: number;
    cost: number;
}

export interface JobIdSettings {
  prefix: string;
  nextJobNumber: number;
  quotePrefix: string;
  nextQuoteNumber: number;
}

export type ColorScheme = 'default' | 'gentle-green' | 'warm-neutral' | 'muted-pink' | 'cool-gray' | 'soft-blue' | 'deep-ocean' | 'vibrant-blue';

export interface ThemeSettings {
  colorScheme?: ColorScheme;
  template?: 'simplistic' | 'modern' | 'informative';
}


export type Page = 
    | 'dashboard'
    | 'jobsList'
    | 'jobDetail'
    | 'customersList'
    | 'customerDetail'
    | 'glassInventory'
    | 'partsLookup'
    | 'calendarView'
    | 'reports'
    | 'usersList'
    | 'techniciansList'
    | 'settings'
    | 'businessProfileSettings'
    | 'jobIdGenerationSettings'
    | 'archivedJobs'
    | 'salesTaxSettings'
    | 'itemCodeSettings'
    | 'scheduleViewSettings'
    | 'partsLookupSettings'
    | 'themeSettings'
    | 'workOrderTemplateSettings'
    | 'workOrderImport'
    | 'login'
    | 'register';

// AI Flow Types

export interface DecodeVinInput {
  vin: string;
}

export interface DecodeVinOutput {
  make: string;
  model: string;
  year: string;
  trim: string;
  engine: string;
  driveType: string;
  bodyClass: string;
  airBags: string;
  fuel: string;
}

export interface LookupPartInput {
  partNumber: string;
}

export interface SupplierInfo {
  name: string;
  stock: number;
  price: number;
  location: string;
}

export interface LookupPartOutput {
  partNumber: string;
  results: SupplierInfo[];
}

export interface SendInviteEmailInput {
  technicianName: string;
  technicianEmail: string;
  companyName: string;
  fromEmail: string;
  appUrl: string;
}

export interface SendInviteEmailOutput {
  success: boolean;
  message: string;
}

export interface SendWelcomeEmailInput {
  userName: string;
  userEmail: string;
  temporaryPassword: string;
  companyName: string;
  appUrl: string;
}

export interface SendWelcomeEmailOutput {
  success: boolean;
  message: string;
}

export interface SendWorkOrderEmailInput {
  customerName: string;
  customerEmail: string;
  companyName: string;
  documentType: string;
  jobId: string;
  pdfAttachment?: string;
}

export interface SendWorkOrderEmailOutput {
  success: boolean;
  message: string;
}
