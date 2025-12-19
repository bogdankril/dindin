
'use client';

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  type ReactNode,
  Suspense,
} from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { AppContext, AppContextType } from '@/context/AppContext';
import { useAuth, useFirebase, useFirestore, useStorage } from '@/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  Unsubscribe,
  collection,
  updateDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import type {
  Job,
  Customer,
  BusinessProfile,
  Page,
  Vehicle,
  PaymentType,
  UserProfile,
  Technician,
  ThemeSettings,
  ColorScheme,
  JobItem,
  ItemCode,
  JobStatus,
  InventoryItem,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import LazyLoad from './LazyLoad';
import { GOOGLE_MAPS_API_KEY } from '@/lib/config';
import {
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase';

const APP_ID = 'glass-pro-3a83';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
  interface Window {
    gm_authFailure?: () => void;
    google?: any;
    initMap?: () => void;
    deferredPrompt?: BeforeInstallPromptEvent;
  }
}

type State = {
  userProfile: UserProfile | null;
  businessProfile: BusinessProfile | null;
  theme: ColorScheme;
  isDataLoaded: boolean;
  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  isMapsApiReady: boolean;
  isUserVerified: boolean;

  currentPage: Page;
  previousPage: Page | null;
  selectedJob: Job | null;
  selectedCustomer: Customer | null;
  navigationParams: any | null;

  // Modal states
  showWorkOrderPreviewModal: boolean;
  workOrderPreviewData: {
    job: Job;
    customer: Customer;
    companyProfile: BusinessProfile;
    salesTaxRate: number;
  } | null;
  showConfirmModal: boolean;
  confirmModalProps: {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
  showEditCustomerModal: boolean;
  editCustomerModalProps: {
    customer: Customer;
    onSave: (customer: Customer) => void;
  };
  showNewVehicleModal: boolean;
  newVehicleModalProps: {
    onSave: (vehicle: Vehicle) => void;
    initialData: Partial<Vehicle>;
  };
  showDateTimePickerModal: boolean;
  dateTimePickerModalProps: {
    onSave: (date: string, time: string, serviceType: string, job?: Job) => void;
    jobToReschedule: Job | null;
    initialDate: string;
    initialTime: string;
    initialServiceType: 'In-Shop' | 'Mobile';
  };
  showJobSelectionModal: boolean;
  jobSelectionModalProps: {
    jobs: Job[];
    selectedDate: Date;
    onSelectJob: (job: Job) => void;
    onRescheduleJob?: (job: Job) => void;
    onAssignTechnician?: (job: Job) => void;
  };
  showNewUserModal: boolean;
  showCreateCustomerModal: boolean;
  createCustomerModalProps: { onSave: (customer: Customer) => void };
  showCollectPaymentModal: boolean;
  collectPaymentModalProps: {
    job: Job;
    onSave: (paymentData: {
      amount: number;
      type: PaymentType;
      notes: string;
    }) => void;
  };
  showTechnicianAssignModal: boolean;
  technicianAssignModalProps: {
    job: Job;
    onAssign: (jobId: string, tech: Technician) => void;
  };
  showAddItemModal: boolean;
  addItemModalProps: {
    onSave: (item: JobItem, index: number | null) => void;
    itemToEdit: JobItem | null;
    editingIndex: number | null;
    defaultItemCodes: ItemCode[];
    inventoryItems: InventoryItem[];
  };
  showUpdateNotificationModal: boolean;
};

type Action =
  | { type: 'SET_USER_PROFILE'; payload: UserProfile | null }
  | { type: 'SET_BUSINESS_PROFILE'; payload: BusinessProfile | null }
  | { type: 'SET_THEME'; payload: ColorScheme }
  | { type: 'SET_IS_DATA_LOADED'; payload: boolean }
  | { type: 'SET_PWA_INSTALL_PROMPT'; payload: BeforeInstallPromptEvent | null }
  | { type: 'SET_MAPS_API_READY'; payload: boolean }
  | {
      type: 'SET_MODAL_STATE';
      payload: {
        modal: keyof Pick<
          State,
          | 'showConfirmModal'
          | 'showWorkOrderPreviewModal'
          | 'showEditCustomerModal'
          | 'showNewVehicleModal'
          | 'showDateTimePickerModal'
          | 'showJobSelectionModal'
          | 'showNewUserModal'
          | 'showCreateCustomerModal'
          | 'showCollectPaymentModal'
          | 'showTechnicianAssignModal'
          | 'showAddItemModal'
          | 'showUpdateNotificationModal'
        >;
        value: any;
      };
    }
  | {
      type: 'SET_MODAL_PROPS';
      payload: {
        modal: keyof Pick<
          State,
          | 'confirmModalProps'
          | 'workOrderPreviewData'
          | 'editCustomerModalProps'
          | 'newVehicleModalProps'
          | 'dateTimePickerModalProps'
          | 'jobSelectionModalProps'
          | 'createCustomerModalProps'
          | 'collectPaymentModalProps'
          | 'technicianAssignModalProps'
          | 'addItemModalProps'
        >;
        props: any;
      };
    }
  | {
      type: 'NAVIGATE';
      payload: {
        page: Page;
        job?: Job | null;
        customer?: Customer | null;
        params?: any | null;
      };
    }
  | { type: 'SET_NAVIGATION_PARAMS'; payload: any | null }
  | { type: 'LOGOUT_USER' }
  | { type: 'SET_USER_VERIFIED'; payload: boolean };

const initialState: State = {
  userProfile: null,
  businessProfile: null,
  theme: 'default',
  isDataLoaded: false,
  pwaInstallPrompt: null,
  isMapsApiReady: false,
  isUserVerified: false,
  currentPage: 'login', // Default to login
  previousPage: null,
  selectedJob: null,
  selectedCustomer: null,
  navigationParams: null,

  showWorkOrderPreviewModal: false,
  workOrderPreviewData: null,
  showConfirmModal: false,
  confirmModalProps: { message: '', onConfirm: () => {}, onCancel: () => {} },
  showEditCustomerModal: false,
  editCustomerModalProps: { customer: {} as Customer, onSave: () => {} },
  showNewVehicleModal: false,
  newVehicleModalProps: { onSave: () => {}, initialData: {} },
  showDateTimePickerModal: false,
  dateTimePickerModalProps: {
    onSave: () => {},
    jobToReschedule: null,
    initialDate: '',
    initialTime: '',
    initialServiceType: 'In-Shop',
  },
  showJobSelectionModal: false,
  jobSelectionModalProps: {
    jobs: [],
    selectedDate: new Date(),
    onSelectJob: () => {},
    onRescheduleJob: () => {},
  },
  showNewUserModal: false,
  showCreateCustomerModal: false,
  createCustomerModalProps: { onSave: () => {} },
  showCollectPaymentModal: false,
  collectPaymentModalProps: { job: {} as Job, onSave: () => {} },
  showTechnicianAssignModal: false,
  technicianAssignModalProps: { job: {} as Job, onAssign: () => {} },
  showAddItemModal: false,
  addItemModalProps: {
    onSave: () => {},
    itemToEdit: null,
    editingIndex: null,
    defaultItemCodes: [],
    inventoryItems: [],
  },
  showUpdateNotificationModal: false,
};

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    case 'SET_BUSINESS_PROFILE':
      return { ...state, businessProfile: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_IS_DATA_LOADED':
      return { ...state, isDataLoaded: action.payload };
    case 'SET_PWA_INSTALL_PROMPT':
      return { ...state, pwaInstallPrompt: action.payload };
    case 'SET_MAPS_API_READY':
      return { ...state, isMapsApiReady: action.payload };
    case 'SET_MODAL_STATE':
      return { ...state, [action.payload.modal]: action.payload.value };
    case 'SET_MODAL_PROPS':
      return { ...state, [action.payload.modal]: action.payload.props };
    case 'SET_USER_VERIFIED':
      return { ...state, isUserVerified: action.payload };
    case 'NAVIGATE':
      // If navigating to login, clear sensitive data
      if (action.payload.page === 'login') {
          return {
              ...initialState,
              currentPage: 'login',
              isDataLoaded: true,
              isMapsApiReady: state.isMapsApiReady,
              pwaInstallPrompt: state.pwaInstallPrompt,
          }
      }
      return {
        ...state,
        previousPage: state.currentPage,
        currentPage: action.payload.page,
        selectedJob: action.payload.job ?? null,
        selectedCustomer: action.payload.customer ?? null,
        navigationParams: action.payload.params ?? null,
      };
    case 'SET_NAVIGATION_PARAMS':
      return { ...state, navigationParams: action.payload };
    case 'LOGOUT_USER':
      return { 
        ...initialState, 
        isDataLoaded: true, 
        isMapsApiReady: state.isMapsApiReady,
        pwaInstallPrompt: state.pwaInstallPrompt,
      };
    default:
      return state;
  }
};

const LATEST_UPDATE_VERSION = '2024-07-26';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const auth = useAuth();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const showAppModal = useCallback(
    (message: string, variant: 'default' | 'destructive' = 'default') => {
      toast({
        title: variant === 'destructive' ? 'Error' : 'Notification',
        description: message,
        variant,
      });
    },
    [toast]
  );
  
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        dispatch({ type: 'SET_USER_VERIFIED', payload: firebaseUser.emailVerified });
      } else {
        setUser(null);
        dispatch({ type: 'LOGOUT_USER' });
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scriptId = 'googleMapsScript';
    if (document.getElementById(scriptId) || window.google?.maps) {
      dispatch({ type: 'SET_MAPS_API_READY', payload: true });
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      dispatch({ type: 'SET_MAPS_API_READY', payload: false });
      console.warn(
        'Google Maps API key is missing. Mapping features will be disabled.'
      );
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=beta`;
    script.async = true;
    script.defer = true;

    window.initMap = () => dispatch({ type: 'SET_MAPS_API_READY', payload: true });
    script.src += `&callback=initMap`;

    window.gm_authFailure = () => {
      showAppModal(
        'Google Maps authentication failed. Please check your API key.',
        'destructive'
      );
      dispatch({ type: 'SET_MAPS_API_READY', payload: false });
    };

    document.head.appendChild(script);

    return () => {
      if (window.initMap) delete window.initMap;
      if (window.gm_authFailure) delete window.gm_authFailure;
    };
  }, [showAppModal]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      if (typeof window === 'undefined') return;
      e.preventDefault();
      window.deferredPrompt = e as BeforeInstallPromptEvent;
      dispatch({
        type: 'SET_PWA_INSTALL_PROMPT',
        payload: e as BeforeInstallPromptEvent,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'beforeinstallprompt',
          handleBeforeInstallPrompt
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !db) {
      if (!user) dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
      return;
    };

    dispatch({ type: 'SET_IS_DATA_LOADED', payload: false });

    let userProfileUnsubscribe: Unsubscribe | null = null;
    let companyProfileUnsubscribe: Unsubscribe | null = null;

    const userProfileRef = doc(db, 'users', user.uid);
    userProfileUnsubscribe = onSnapshot(userProfileRef,
      (userDoc) => {
        if (userDoc.exists()) {
          const userProfileData = { id: userDoc.id, uid: user.uid, ...userDoc.data() } as UserProfile;
          dispatch({ type: 'SET_USER_PROFILE', payload: userProfileData });
          
          if (userProfileData.companyId) {
            const companyRef = doc(db, `artifacts/${APP_ID}/users/${userProfileData.companyId}/settings/businessProfile`);
            companyProfileUnsubscribe = onSnapshot(
              companyRef,
              (companyDoc) => {
                if (companyDoc.exists()) {
                  dispatch({
                    type: 'SET_BUSINESS_PROFILE',
                    payload: {
                      id: companyDoc.id,
                      ...companyDoc.data(),
                    } as BusinessProfile,
                  });
                }
                dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
                if(state.currentPage === 'login' || state.currentPage === 'register') {
                    dispatch({ type: 'NAVIGATE', payload: { page: 'dashboard' }});
                }
              },
              (error) => {
                showAppModal('Error loading company data.', 'destructive');
                dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
              }
            );
          } else {
            showAppModal('User profile is missing company ID.', 'destructive');
            dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
            auth?.signOut();
          }
        } else {
            // This might happen during registration, let registration flow handle it.
            if(state.currentPage !== 'register'){
                showAppModal('User profile not found. Please try logging in again.', 'destructive');
                auth?.signOut();
            }
             dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
        }
      },
      (error) => {
        showAppModal('Error loading user profile.', 'destructive');
        dispatch({ type: 'SET_IS_DATA_LOADED', payload: true });
        auth?.signOut();
      }
    );

    return () => {
      if (userProfileUnsubscribe) userProfileUnsubscribe();
      if (companyProfileUnsubscribe) companyProfileUnsubscribe();
    };
  }, [user, db, showAppModal, auth, state.currentPage]);

  const handleInstallPwa = useCallback(async () => {
    const promptEvent = window.deferredPrompt;
    if (!promptEvent) {
      showAppModal(
        "App can't be installed right now. It might already be installed or your browser doesn't support it.",
        'destructive'
      );
      return;
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`PWA install prompt outcome: ${outcome}`);
    window.deferredPrompt = undefined;
    dispatch({ type: 'SET_PWA_INSTALL_PROMPT', payload: null });
  }, [showAppModal]);

  const setModalState = useCallback(
    (
      modal: keyof Pick<
        State,
        | 'showConfirmModal'
        | 'showWorkOrderPreviewModal'
        | 'showEditCustomerModal'
        | 'showNewVehicleModal'
        | 'showDateTimePickerModal'
        | 'showJobSelectionModal'
        | 'showNewUserModal'
        | 'showCreateCustomerModal'
        | 'showCollectPaymentModal'
        | 'showTechnicianAssignModal'
        | 'showAddItemModal'
        | 'showUpdateNotificationModal'
      >,
      value: any
    ) => {
      dispatch({ type: 'SET_MODAL_STATE', payload: { modal, value } });
    },
    []
  );

  const setModalProps = useCallback(
    (
      modal: keyof Pick<
        State,
        | 'confirmModalProps'
        | 'workOrderPreviewData'
        | 'editCustomerModalProps'
        | 'newVehicleModalProps'
        | 'dateTimePickerModalProps'
        | 'jobSelectionModalProps'
        | 'createCustomerModalProps'
        | 'collectPaymentModalProps'
        | 'technicianAssignModalProps'
        | 'addItemModalProps'
      >,
      props: any
    ) => {
      dispatch({ type: 'SET_MODAL_PROPS', payload: { modal, props } });
    },
    []
  );

  const navigateTo = useCallback(
    (
      page: Page,
      job: Job | null = null,
      customer: Customer | null = null,
      params: any | null = null
    ) => {
      dispatch({ type: 'NAVIGATE', payload: { page, job, customer, params } });
    },
    []
  );

  const setNavigationParams = useCallback((params: any) => {
    dispatch({ type: 'SET_NAVIGATION_PARAMS', payload: params });
  }, []);

  const showCustomConfirmModal = useCallback(
    (
      message: string,
      onConfirm: () => void,
      onCancel: () => void = () => {}
    ) => {
      setModalProps('confirmModalProps', { message, onConfirm, onCancel });
      setModalState('showConfirmModal', true);
    },
    [setModalProps, setModalState]
  );

  const updateJobSchedule = useCallback(
    (
      jobId: string,
      date: string,
      time: string,
      serviceType: 'In-Shop' | 'Mobile'
    ) => {
      if (!db || !state.userProfile?.id) return;
      const jobRef = doc(db, `artifacts/${APP_ID}/users/${state.userProfile.id}/jobs`, jobId);
      updateDocumentNonBlocking(jobRef, {
        scheduledDate: date,
        scheduledTime: time,
        serviceType: serviceType,
      });
      showAppModal(`Job ${jobId.substring(0, 6)} has been rescheduled.`);
    },
    [db, state.userProfile, showAppModal]
  );

  const unarchiveJob = useCallback(
    async (job: Job) => {
      if (!db || !state.userProfile?.id) return;

      const jobIdSettingsRef = doc(
        db,
        `artifacts/${APP_ID}/users/${state.userProfile.id}/settings/jobIdGeneration`
      );
      const archivedJobRef = doc(
        db,
        `artifacts/${APP_ID}/users/${state.userProfile.id}/archivedJobs`,
        job.id
      );
      const newJobRef = doc(
        collection(db, `artifacts/${APP_ID}/users/${state.userProfile.id}/jobs`)
      );

      try {
        await runTransaction(db, async (transaction: any) => {
          const settingsDoc = await transaction.get(jobIdSettingsRef);
          if (!settingsDoc.exists()) {
            throw new Error('Job ID settings not found.');
          }
          const settings = settingsDoc.data();
          const newJobId = `${settings.prefix}${settings.nextJobNumber}`;

          transaction.delete(archivedJobRef);
          transaction.set(newJobRef, { ...job, jobId: newJobId, archivedAt: null });
          transaction.update(jobIdSettingsRef, {
            nextJobNumber: settings.nextJobNumber + 1,
          });
        });
        showAppModal('Job restored successfully!');
      } catch (e: any) {
        showAppModal(`Error restoring job: ${e.message}`, 'destructive');
      }
    },
    [db, state.userProfile, showAppModal]
  );

  const permanentlyDeleteJobs = useCallback(
    async (jobIds: string[]) => {
      if (!db || !state.userProfile) {
        return;
      }
      const batch = writeBatch(db);
      jobIds.forEach(id => {
        const docRef = doc(
          db,
          `artifacts/${APP_ID}/users/${state.userProfile!.id}/archivedJobs`,
          id
        );
        batch.delete(docRef);
      });
      try {
        await batch.commit();
        showAppModal(`${jobIds.length} job(s) permanently deleted.`);
      } catch (e: any) {
        showAppModal(`Error deleting jobs: ${e.message}`, 'destructive');
      }
    },
    [db, state.userProfile, showAppModal]
  );

  const contextValue: AppContextType = useMemo(
    () => ({
      db,
      auth,
      storage,
      userId: state.userProfile?.uid ?? null,
      user: user, // The raw firebase user
      isAuthReady: !state.isUserLoading,
      isDataLoaded: state.isDataLoaded,
      authError: null, // This can be enhanced if needed
      userProfile: state.userProfile,
      businessProfile: state.businessProfile,
      isUserVerified: state.isUserVerified,
      theme: state.businessProfile?.colorScheme || 'default',
      canInstallPwa: !!state.pwaInstallPrompt,
      handleInstallPwa,
      showAppModal,
      navigateTo,
      navigationParams: state.navigationParams,
      setNavigationParams,
      isMapsApiReady: state.isMapsApiReady,

      setShowWorkOrderPreviewModal: (isOpen) =>
        setModalState('showWorkOrderPreviewModal', isOpen),
      setWorkOrderPreviewData: (data) =>
        setModalProps('workOrderPreviewData', data),

      showCustomConfirmModal,
      updateJobSchedule,
      unarchiveJob,
      permanentlyDeleteJobs,

      currentPage: state.currentPage,
      previousPage: state.previousPage,
      selectedJob: state.selectedJob,
      selectedCustomer: state.selectedCustomer,

      setShowEditCustomerModal: (isOpen: boolean) =>
        setModalState('showEditCustomerModal', isOpen),
      setEditCustomerModalProps: (props) =>
        setModalProps('editCustomerModalProps', props),

      setShowNewVehicleModal: (isOpen: boolean) =>
        setModalState('showNewVehicleModal', isOpen),
      setNewVehicleModalProps: (props) =>
        setModalProps('newVehicleModalProps', props),

      setShowDateTimePickerModal: (isOpen: boolean) =>
        setModalState('showDateTimePickerModal', isOpen),
      setDateTimePickerModalProps: (props) =>
        setModalProps('dateTimePickerModalProps', props),
      setShowJobSelectionModal: (isOpen: boolean) =>
        setModalState('showJobSelectionModal', isOpen),
      setJobSelectionModalProps: (props) =>
        setModalProps('jobSelectionModalProps', props),
      setShowNewUserModal: (isOpen: boolean) =>
        setModalState('showNewUserModal', isOpen),

      setShowCreateCustomerModal: (isOpen: boolean) =>
        setModalState('showCreateCustomerModal', isOpen),
      setCreateCustomerModalProps: (props) =>
        setModalProps('createCustomerModalProps', props),

      setShowCollectPaymentModal: (isOpen: boolean) =>
        setModalState('showCollectPaymentModal', isOpen),
      setCollectPaymentModalProps: (props) =>
        setModalProps('collectPaymentModalProps', props),

      setShowTechnicianAssignModal: (isOpen: boolean) =>
        setModalState('showTechnicianAssignModal', isOpen),
      setTechnicianAssignModalProps: (props) =>
        setModalProps('technicianAssignModalProps', props),

      setShowAddItemModal: (isOpen: boolean) =>
        setModalState('showAddItemModal', isOpen),
      setAddItemModalProps: (props) => setModalProps('addItemModalProps', props),

      setShowUpdateNotificationModal: (isOpen: boolean) =>
        setModalState('showUpdateNotificationModal', isOpen),
      LATEST_UPDATE_VERSION,
    }),
    [
      db,
      auth,
      storage,
      state,
      user,
      handleInstallPwa,
      showAppModal,
      navigateTo,
      setNavigationParams,
      showCustomConfirmModal,
      updateJobSchedule,
      unarchiveJob,
      permanentlyDeleteJobs,
      setModalState,
      setModalProps,
    ]
  );

  const handleConfirmModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showConfirmModal', isOpen);
    },
    [setModalState]
  );
  const handleWorkOrderModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showWorkOrderPreviewModal', isOpen);
    },
    [setModalState]
  );
  const handleEditCustomerModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showEditCustomerModal', isOpen);
    },
    [setModalState]
  );
  const handleNewVehicleModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showNewVehicleModal', isOpen);
    },
    [setModalState]
  );
  const handleDateTimePickerModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showDateTimePickerModal', isOpen);
    },
    [setModalState]
  );
  const handleJobSelectionModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showJobSelectionModal', isOpen);
    },
    [setModalState]
  );
  const handleNewUserModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showNewUserModal', isOpen);
    },
    [setModalState]
  );
  const handleCreateCustomerModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showCreateCustomerModal', isOpen);
    },
    [setModalState]
  );
  const handleCollectPaymentModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showCollectPaymentModal', isOpen);
    },
    [setModalState]
  );
  const handleTechnicianAssignModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showTechnicianAssignModal', isOpen);
    },
    [setModalState]
  );
  const handleAddItemModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showAddItemModal', isOpen);
    },
    [setModalState]
  );
  const handleUpdateNotificationModalOpenChange = useCallback(
    (isOpen: boolean) => {
      setModalState('showUpdateNotificationModal', isOpen);
    },
    [setModalState]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <Suspense fallback={null}>
        <div
          className={cn('theme-renderer', state.businessProfile?.colorScheme || 'default')}
        >
          {children}
        </div>
        {state.showConfirmModal && (
          <LazyLoad
            path="modals/ConfirmDialog"
            isOpen={state.showConfirmModal}
            onOpenChange={handleConfirmModalOpenChange}
            title="Confirm Action"
            message={state.confirmModalProps.message}
            onConfirm={() => {
              state.confirmModalProps.onConfirm();
              handleConfirmModalOpenChange(false);
            }}
            onCancel={() => {
              state.confirmModalProps.onCancel();
              handleConfirmModalOpenChange(false);
            }}
          />
        )}
        {state.showWorkOrderPreviewModal && state.workOrderPreviewData && (
          <LazyLoad
            path="modals/WorkOrderPreviewDialog"
            isOpen={state.showWorkOrderPreviewModal}
            onOpenChange={handleWorkOrderModalOpenChange}
            job={state.workOrderPreviewData.job}
            customer={state.workOrderPreviewData.customer}
            companyProfile={state.workOrderPreviewData.companyProfile}
            salesTaxRate={state.workOrderPreviewData.salesTaxRate}
          />
        )}
        {state.showEditCustomerModal && (
          <LazyLoad
            path="pages/modals/EditCustomerDialog"
            isOpen={state.showEditCustomerModal}
            onOpenChange={handleEditCustomerModalOpenChange}
            customer={state.editCustomerModalProps.customer}
            onSave={state.editCustomerModalProps.onSave}
          />
        )}
        {state.showNewVehicleModal && (
          <LazyLoad
            path="modals/NewVehicleDialog"
            isOpen={state.showNewVehicleModal}
            onOpenChange={handleNewVehicleModalOpenChange}
            onSave={state.newVehicleModalProps.onSave}
            initialData={state.newVehicleModalProps.initialData}
          />
        )}
        {state.showDateTimePickerModal && (
          <LazyLoad
            path="modals/DateTimePickerDialog"
            isOpen={state.showDateTimePickerModal}
            onOpenChange={handleDateTimePickerModalOpenChange}
            onSave={state.dateTimePickerModalProps.onSave}
            jobToReschedule={state.dateTimePickerModalProps.jobToReschedule}
            initialDate={state.dateTimePickerModalProps.initialDate}
            initialTime={state.dateTimePickerModalProps.initialTime}
            initialServiceType={state.dateTimePickerModalProps.initialServiceType}
          />
        )}
        {state.showJobSelectionModal && (
          <LazyLoad
            path="modals/JobSelectionDialog"
            isOpen={state.showJobSelectionModal}
            onOpenChange={handleJobSelectionModalOpenChange}
            jobs={state.jobSelectionModalProps.jobs}
            selectedDate={state.jobSelectionModalProps.selectedDate}
            onSelectJob={state.jobSelectionModalProps.onSelectJob}
            onRescheduleJob={state.jobSelectionModalProps.onRescheduleJob}
            onAssignTechnician={state.jobSelectionModalProps.onAssignTechnician}
          />
        )}
        {state.showNewUserModal && (
          <LazyLoad
            path="modals/NewUserDialog"
            isOpen={state.showNewUserModal}
            onOpenChange={handleNewUserModalOpenChange}
          />
        )}
        {state.showCreateCustomerModal && (
          <LazyLoad
            path="pages/modals/CreateCustomerDialog"
            isOpen={state.showCreateCustomerModal}
            onOpenChange={handleCreateCustomerModalOpenChange}
            onSave={state.createCustomerModalProps.onSave}
          />
        )}
        {state.showCollectPaymentModal && (
          <LazyLoad
            path="modals/CollectPaymentDialog"
            isOpen={state.showCollectPaymentModal}
            onOpenChange={handleCollectPaymentModalOpenChange}
            job={state.collectPaymentModalProps.job}
            onSave={state.collectPaymentModalProps.onSave}
          />
        )}
        {state.showTechnicianAssignModal && (
          <LazyLoad
            path="modals/TechnicianAssignDialog"
            isOpen={state.showTechnicianAssignModal}
            onOpenChange={handleTechnicianAssignModalOpenChange}
            job={state.technicianAssignModalProps.job}
            onAssign={state.technicianAssignModalProps.onAssign}
          />
        )}
        {state.showAddItemModal && (
          <LazyLoad
            path="modals/AddItemDialog"
            isOpen={state.showAddItemModal}
            onOpenChange={handleAddItemModalOpenChange}
            onSave={state.addItemModalProps.onSave}
            itemToEdit={state.addItemModalProps.itemToEdit}
            editingIndex={state.addItemModalProps.editingIndex}
            defaultItemCodes={state.addItemModalProps.defaultItemCodes}
            inventoryItems={state.addItemModalProps.inventoryItems}
          />
        )}
        {state.showUpdateNotificationModal && (
          <LazyLoad
            path="modals/UpdateNotificationDialog"
            isOpen={state.showUpdateNotificationModal}
            onOpenChange={handleUpdateNotificationModalOpenChange}
            version={LATEST_UPDATE_VERSION}
          />
        )}
      </Suspense>
    </AppContext.Provider>
  );
}
