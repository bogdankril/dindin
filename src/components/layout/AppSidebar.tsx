"use client";

import React from 'react';
import { useAppContext } from "@/hooks/useAppContext";
import type { Page } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wrench,
  Calendar,
  Users,
  GlassWater,
  LogOut,
  Settings,
  UserCog,
  Send,
  Users2,
  X,
  BarChart,
  Search,
  Download,
  PanelLeftClose,
  PanelRightClose
} from "lucide-react";
import { Button } from '@/components/ui/button';

const adminNavItems = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'jobsList', label: 'Jobs', icon: Wrench, activeIn: ['jobDetail'] },
  { page: 'calendarView', label: 'Schedule', icon: Calendar },
  { page: 'customersList', label: 'Customers', icon: Users, activeIn: ['customerDetail'] },
  { page: 'glassInventory', label: 'Inventory', icon: GlassWater },
  { page: 'partsLookup', label: 'Parts Lookup', icon: Search },
  { page: 'reports', label: 'Reports', icon: BarChart },
  { page: 'settings', label: 'Settings', icon: Settings, activeIn: [
      'businessProfileSettings',
      'jobIdGenerationSettings',
      'archivedJobs',
      'salesTaxSettings',
      'itemCodeSettings',
      'testJobGenerator',
      'scheduleViewSettings',
      'usersList',
      'techniciansList'
    ]
  },
];

const technicianNavItems = [
    { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { page: 'jobsList', label: 'My Jobs', icon: Wrench, activeIn: ['jobDetail'] },
];

interface AppSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function AppSidebar({ isOpen, setIsOpen }: AppSidebarProps) {
  const { auth, navigateTo, showAppModal, userProfile, businessProfile, canInstallPwa, handleInstallPwa, currentPage } = useAppContext();

  const handleLogout = async () => {
    if (auth) {
      await auth.signOut();
    }
    navigateTo('login');
    showAppModal('You have been logged out.');
  };

  const navItems = userProfile?.role === 'technician' ? technicianNavItems : adminNavItems;
  const defaultAppName = userProfile?.role === 'technician' ? 'GlassProTech' : 'GlassPro';

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-10 flex-col border-r bg-background sm:flex transition-all duration-300",
      isOpen ? "w-72 sm:w-56" : "w-0 sm:w-14",
    )}>
       <div className={cn(
          "flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6",
          !isOpen && "justify-center"
       )}>
        <button onClick={() => navigateTo('dashboard')} className="flex items-center gap-2 font-semibold">
           {businessProfile?.logoUrl ? (
              <img src={businessProfile.logoUrl} alt={`${businessProfile.name} Logo`} className="h-6 w-auto object-contain" />
          ) : (
             <GlassWater className="h-6 w-6" />
          )}
          <span className={cn(isOpen ? 'block' : 'hidden')}>
            {businessProfile?.name || defaultAppName}
          </span>
        </button>
        <Button variant="outline" size="icon" className="ml-auto h-8 w-8 sm:hidden" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close Sidebar</span>
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className={cn("grid items-start px-2 text-sm font-medium lg:px-4", !isOpen && "justify-center")}>
          {navItems.map((item) => {
            const isActive = currentPage === item.page || (item.activeIn && item.activeIn.includes(currentPage));
            return (
              <button
                key={item.page}
                onClick={() => navigateTo(item.page as Page)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  isActive && 'bg-muted text-primary',
                  !isOpen && "justify-center"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className={cn(isOpen ? "block" : "hidden")}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
       <div className="mt-auto p-4 border-t">
          {canInstallPwa && (
            <Button size="sm" variant="outline" className="w-full mb-2" onClick={handleInstallPwa}>
              <Download className={cn("h-4 w-4", isOpen && "mr-2")} />
              <span className={cn(isOpen ? "block" : "hidden")}>Install App</span>
            </Button>
          )}
          <Button size="sm" variant="destructive" className="w-full" onClick={handleLogout}>
             <LogOut className={cn("h-4 w-4", isOpen && "mr-2")} />
             <span className={cn(isOpen ? "block" : "hidden")}>Logout</span>
          </Button>
      </div>
    </aside>
  );
}