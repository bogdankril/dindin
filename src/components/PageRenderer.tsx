
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/hooks/useAppContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Page as PageType } from '@/lib/types';

// Loading component for dynamic imports
const PageLoader = () => (
  <div className="space-y-6">
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const pageComponentMap: Record<string, React.ComponentType<any>> = {
  Dashboard: dynamic(() => import('@/components/pages/Dashboard'), { loading: () => <PageLoader /> }),
  JobsList: dynamic(() => import('@/components/pages/JobsList'), { loading: () => <PageLoader /> }),
  JobDetail: dynamic(() => import('@/components/pages/JobDetail'), { loading: () => <PageLoader /> }),
  CustomersList: dynamic(() => import('@/components/pages/CustomersList'), { loading: () => <PageLoader /> }),
  CustomerDetail: dynamic(() => import('@/components/pages/CustomerDetail'), { loading: () => <PageLoader /> }),
  GlassInventory: dynamic(() => import('@/components/pages/GlassInventory'), { loading: () => <PageLoader /> }),
  CalendarView: dynamic(() => import('@/app/pages/CalendarView'), { loading: () => <PageLoader /> }),
  Reports: dynamic(() => import('@/components/pages/Reports'), { loading: () => <PageLoader /> }),
  Settings: dynamic(() => import('@/components/pages/Settings'), { loading: () => <PageLoader /> }),
  BusinessProfileSettings: dynamic(() => import('@/components/pages/settings/BusinessProfileSettings'), { loading: () => <PageLoader /> }),
  JobIdGenerationSettings: dynamic(() => import('@/components/pages/settings/JobIdGenerationSettings'), { loading: () => <PageLoader /> }),
  ArchivedJobs: dynamic(() => import('@/components/pages/settings/ArchivedJobs'), { loading: () => <PageLoader /> }),
  SalesTaxSettings: dynamic(() => import('@/components/pages/settings/SalesTaxSettings'), { loading: () => <PageLoader /> }),
  ItemCodeSettings: dynamic(() => import('@/components/pages/settings/ItemCodeSettings'), { loading: () => <PageLoader /> }),
  ScheduleViewSettings: dynamic(() => import('@/app/pages/settings/ScheduleViewSettings'), { loading: () => <PageLoader /> }),
  PartsLookupSettings: dynamic(() => import('@/components/pages/settings/PartsLookupSettings'), { loading: () => <PageLoader /> }),
  UsersList: dynamic(() => import('@/app/pages/UsersList'), { loading: () => <PageLoader /> }),
  TechniciansList: dynamic(() => import('@/app/pages/settings/TechniciansList'), { loading: () => <PageLoader /> }),
  Register: dynamic(() => import('@/components/pages/Register'), { loading: () => <PageLoader /> }),
  PartsLookup: dynamic(() => import('@/components/pages/PartsLookup'), { loading: () => <PageLoader /> }),
  ThemeSettings: dynamic(() => import('@/components/pages/settings/ThemeSettings'), { loading: () => <PageLoader /> }),
  WorkOrderTemplateSettings: dynamic(() => import('@/components/pages/settings/WorkOrderTemplateSettings'), { loading: () => <PageLoader /> }),
  WorkOrderImport: dynamic(() => import('@/components/pages/settings/WorkOrderImport'), { loading: () => <PageLoader /> }),
};

export default function PageRenderer() {
  const { currentPage, selectedJob, selectedCustomer, navigationParams, navigateTo } = useAppContext();

  const capitalizedPage = currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  const PageComponent = pageComponentMap[capitalizedPage] || pageComponentMap['Dashboard'];
  
  const componentProps: any = {
      job: selectedJob,
      customer: selectedCustomer,
      navigationParams: navigationParams,
      onSaveSuccess: () => navigateTo('customersList'),
      onCancel: () => navigateTo('customersList')
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent {...componentProps} />
    </Suspense>
  );
}
