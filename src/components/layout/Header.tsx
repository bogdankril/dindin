"use client";

import { useAppContext } from "@/hooks/useAppContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Home,
  Wrench,
  Calendar,
  Users,
  GlassWater,
  Settings,
  BarChart,
  Search,
  PanelLeft,
} from "lucide-react";
import { Page } from "@/lib/types";

interface HeaderProps {
  onMenuClick: () => void;
}

const navItems = [
  { page: 'dashboard', label: 'Dashboard', icon: Home },
  { page: 'jobsList', label: 'Jobs', icon: Wrench },
  { page: 'calendarView', label: 'Schedule', icon: Calendar },
  { page: 'customersList', label: 'Customers', icon: Users },
  { page: 'glassInventory', label: 'Inventory', icon: GlassWater },
  { page: 'partsLookup', label: 'Parts Lookup', icon: Search },
  { page: 'reports', label: 'Reports', icon: BarChart },
  { page: 'settings', label: 'Settings', icon: Settings },
];

export default function Header({ onMenuClick }: HeaderProps) {
  const { navigateTo, currentPage } = useAppContext();

  const getPageTitle = () => {
    switch (currentPage) {
        case 'dashboard': return 'Dashboard';
        case 'jobsList': return 'Jobs';
        case 'jobDetail': return 'Job Details';
        case 'customersList': return 'Customers';
        case 'customerDetail': return 'Customer Details';
        case 'glassInventory': return 'Inventory';
        case 'calendarView': return 'Schedule';
        case 'settings': return 'Settings';
        case 'businessProfileSettings': return 'Business Profile';
        case 'usersList': return 'User Management';
        case 'themeSettings': return 'Theme & Appearance';
        case 'workOrderTemplateSettings': return 'Work Order Template';
        case 'jobIdGenerationSettings': return 'Job ID Generation';
        case 'partsLookupSettings': return 'Parts Lookup Settings';
        case 'salesTaxSettings': return 'Sales Tax Settings';
        case 'itemCodeSettings': return 'Default Item Codes';
        case 'scheduleViewSettings': return 'Schedule View Settings';
        case 'archivedJobs': return 'Archived Jobs';
        case 'workOrderImport': return 'Import Work Orders';
        case 'reports': return 'Reports';
        case 'partsLookup': return 'Parts Lookup';
        default: return 'GlassPro';
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Button size="icon" variant="outline" className="sm:hidden" onClick={onMenuClick}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        <Button size="icon" variant="outline" className="hidden sm:flex" onClick={onMenuClick}>
          <PanelLeft className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <h1 className="font-semibold text-lg md:text-xl flex-1">{getPageTitle()}</h1>
    </header>
  );
}