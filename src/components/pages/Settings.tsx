

"use client";

import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileArchive, GanttChartSquare, Landmark, Network, Percent, Settings as SettingsIcon, Users2, UserPlus, FileText, Palette, FileUp } from 'lucide-react';

const settingsItems = [
    { page: 'businessProfileSettings', title: 'Business Profile', description: "Manage your company's general information.", icon: Landmark },
    { page: 'usersList', title: 'User Management', description: 'Create, manage roles, and delete user accounts.', icon: Users2 },
    { page: 'themeSettings', title: 'Theme & Appearance', description: 'Customize the look and feel of the application.', icon: Palette },
    { page: 'workOrderTemplateSettings', title: 'Work Order Template', description: 'Choose the layout for your work orders and quotes.', icon: FileText },
    { page: 'jobIdGenerationSettings', title: 'Job ID Generation', description: 'Configure how new Job IDs are generated.', icon: GanttChartSquare },
    { page: 'partsLookupSettings', title: 'Parts Lookup Settings', description: 'Configure credentials for part suppliers like Mygrant.', icon: Network },
    { page: 'salesTaxSettings', title: 'Sales Tax Settings', description: 'Set up your sales tax rate for jobs.', icon: Percent },
    { page: 'itemCodeSettings', title: 'Default Item Codes', description: 'Manage pre-defined glass and service item codes.', icon: GanttChartSquare },
    { page: 'scheduleViewSettings', title: 'Schedule View Settings', description: 'Configure default calendar view.', icon: SettingsIcon },
    { page: 'archivedJobs', title: 'Archived Jobs', description: 'View and manage past archived jobs.', icon: FileArchive },
    { page: 'workOrderImport', title: 'Import Work Orders', description: 'Bulk-import existing work orders from a CSV file.', icon: FileUp },
];

export default function Settings() {
  const { navigateTo } = useAppContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsItems.map(item => (
            <button
                key={item.page}
                onClick={() => navigateTo(item.page as any)}
                className={`flex items-center text-left p-4 border rounded-lg hover:bg-muted/50 transition-colors`}
            >
                <item.icon className={`h-8 w-8 mr-4 text-primary`} />
                <div className="flex-grow">
                    <p className={`font-semibold`}>{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
        ))}
      </CardContent>
      <CardFooter>
          <Button variant="outline" onClick={() => navigateTo('dashboard')}>Back to Dashboard</Button>
      </CardFooter>
    </Card>
  );
}
