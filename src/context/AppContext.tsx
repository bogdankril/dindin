
import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';
import type { Job, Customer, BusinessProfile, Page, Vehicle, InventoryItem, PaymentType, Technician, UserProfile, ColorScheme, JobItem, ItemCode } from '@/lib/types';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';


export interface AppContextType {
  db: Firestore | null; 
  auth: Auth | null; 
  storage: FirebaseStorage | null; 
  userId: string | null;
  user: User | null;
  isAuthReady: boolean;
  isDataLoaded: boolean;
  authError: string | null;
  userProfile: UserProfile | null;
  businessProfile: BusinessProfile | null;
  isUserVerified: boolean;
  theme: ColorScheme;
  canInstallPwa: boolean;
  handleInstallPwa: () => void;
  showAppModal: (message: string, variant?: "default" | "destructive") => void;
  navigateTo: (page: Page, job?: Job | null, customer?: Customer | null, params?: any | null) => void;
  navigationParams: any | null;
  setNavigationParams: (params: any) => void;
  isMapsApiReady: boolean;
  
  setShowWorkOrderPreviewModal: (isOpen: boolean) => void;
  setWorkOrderPreviewData: (data: {
    job: Job;
    customer: Customer;
    companyProfile: BusinessProfile;
    salesTaxRate: number;
  } | null) => void;

  showCustomConfirmModal: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
  updateJobSchedule: (jobId: string, date: string, time: string, serviceType: 'In-Shop' | 'Mobile') => void;
  unarchiveJob: (job: Job) => Promise<void>;
  permanentlyDeleteJobs: (jobIds: string[]) => Promise<void>;
  
  currentPage: Page;
  previousPage: Page | null;
  selectedJob: Job | null;
  selectedCustomer: Customer | null;

  // Modal States & Setters
  setShowEditCustomerModal: (isOpen: boolean) => void;
  setEditCustomerModalProps: (props: { customer: Customer; onSave: (customer: Customer) => void; }) => void;

  setShowNewVehicleModal: (isOpen: boolean) => void;
  setNewVehicleModalProps: (props: { onSave: (vehicle: Partial<Vehicle>) => void, initialData?: Partial<Vehicle>}) => void;
  
  setShowDateTimePickerModal: (isOpen: boolean) => void;
  setDateTimePickerModalProps: (props: {
    onSave: (date: string, time: string, serviceType: 'In-Shop' | 'Mobile', job?: Job) => void,
    jobToReschedule?: Job | null,
    initialDate?: string | Date,
    initialTime?: string,
    initialServiceType?: 'In-Shop' | 'Mobile'
  }) => void;
  
  setShowJobSelectionModal: (isOpen: boolean) => void;
  setJobSelectionModalProps: (props: {
    jobs: Job[],
    selectedDate: Date,
    onSelectJob: (job: Job) => void,
    onRescheduleJob?: (job: Job) => void;
    onAssignTechnician?: (job: Job) => void;
  }) => void;

  setShowNewUserModal: (isOpen: boolean) => void;
  
  setShowCreateCustomerModal: (isOpen: boolean) => void;
  setCreateCustomerModalProps: (props: { onSave: (customer: Customer) => void; }) => void;

  setShowCollectPaymentModal: (isOpen: boolean) => void;
  setCollectPaymentModalProps: (props: {
    job: Job;
    onSave: (paymentData: { amount: number; type: PaymentType; notes: string }) => void;
  }) => void;

  setShowTechnicianAssignModal: (isOpen: boolean) => void;
  setTechnicianAssignModalProps: (props: {
    job: Job;
    onAssign: (jobId: string, tech: Technician) => void;
  }) => void;

  setShowAddItemModal: (isOpen: boolean) => void;
  setAddItemModalProps: (props: {
    onSave: (item: JobItem, index: number | null) => void;
    itemToEdit: JobItem | null;
    editingIndex: number | null;
    defaultItemCodes: ItemCode[];
    inventoryItems: InventoryItem[];
  }) => void;

  setShowUpdateNotificationModal: (isOpen: boolean) => void;
  LATEST_UPDATE_VERSION: string;
}

export const AppContext = createContext<AppContextType | null>(null);
