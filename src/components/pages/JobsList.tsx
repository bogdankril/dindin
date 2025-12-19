"use client";

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Job } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/dates';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMemoFirebase } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

type JobFilter = "all" | "quotes" | "scheduled" | "unscheduled" | "completed";

type BadgeVariant = "quote" | "work_order" | "scheduled" | "completed" | "default" | "secondary" | "destructive" | "outline" | null | undefined;

const getDocumentStatusBadge = (job: Job): { text: string; variant: BadgeVariant } => {
  if (['completed', 'billed', 'partially-paid', 'paid'].includes(job.status)) {
    return { text: 'C', variant: 'completed' };
  }
  if (job.isQuote) {
    return { text: 'Q', variant: 'quote' };
  }
  if (job.scheduledDate) {
    return { text: 'S', variant: 'scheduled' };
  }
  return { text: 'W', variant: 'work_order' };
};

const JobTable = ({ jobs, navigateTo }: { jobs: Job[], navigateTo: any }) => {
    return (
    <div className="border rounded-md overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Date Created</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {jobs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            No jobs in this category.
                        </TableCell>
                    </TableRow>
                ) : (
                    jobs.map((job) => {
                        const statusBadge = getDocumentStatusBadge(job);
                        const vehicleText = [job.make, job.model, job.year ? `(${job.year})` : ''].filter(Boolean).join(' ');
                        return (
                            <TableRow key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer hover:bg-muted/50">
                                <TableCell>
                                    <Badge variant={statusBadge.variant}>{statusBadge.text}</Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">{job.jobId}</Badge>
                                </TableCell>
                                <TableCell>{job.customerName}</TableCell>
                                <TableCell>{vehicleText}</TableCell>
                                <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    </div>
    )
};

const JobCardList = ({ jobs, navigateTo }: { jobs: Job[], navigateTo: any }) => {
    if (jobs.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10">
                No jobs in this category.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => {
                const statusBadge = getDocumentStatusBadge(job);
                const vehicleText = [job.make, job.model, job.year ? `(${job.year})` : ''].filter(Boolean).join(' ');
                return (
                    <Card key={job.id} onClick={() => navigateTo('jobDetail', job)} className="cursor-pointer hover:bg-muted/50">
                        <CardContent className="p-4 space-y-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-lg">{job.customerName}</p>
                                    <p className="text-sm text-muted-foreground">{vehicleText}</p>
                                </div>
                                <Badge variant={statusBadge.variant}>
                                    {statusBadge.text}
                                </Badge>
                            </div>
                             <div className="text-sm text-muted-foreground">
                                <p>ID: {job.jobId}</p>
                                <p>Created: {formatDateTime(job.createdAt)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    );
};


const sections: { value: JobFilter, title: string }[] = [
    { value: "all", title: "All" },
    { value: "quotes", title: "Quotes" },
    { value: "scheduled", title: "Scheduled" },
    { value: "unscheduled", title: "Unscheduled" },
    { value: "completed", title: "Completed" },
];

export default function JobsList() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const isMobile = useIsMobile();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<JobFilter>("all");

  const jobsQuery = useMemoFirebase(() => {
    if (!db || !userProfile?.id) return null;

    const baseQuery = query(collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/jobs`), where('archivedAt', '==', null));

    if (userProfile.role === 'technician') {
        return query(baseQuery, where('technicianId', '==', userProfile.id));
    }
    
    return baseQuery;

  }, [db, userProfile]);

  useEffect(() => {
    if (!jobsQuery) {
        setJobs([]);
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching jobs: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [jobsQuery, showAppModal]);
  
  const completedStatuses: Job['status'][] = ['completed', 'billed', 'partially-paid', 'paid'];

  const filteredJobs = useMemo(() => {
    const baseJobs = jobs.filter(job =>
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.jobId || job.id)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vin?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const workOrders = baseJobs.filter(j => !j.isQuote);

    switch(activeFilter) {
      case "all": return baseJobs;
      case "quotes": return baseJobs.filter(j => j.isQuote);
      case "scheduled": return workOrders.filter(j => !!j.scheduledDate);
      case "unscheduled": return workOrders.filter(j => j.status === 'new' && !j.scheduledDate);
      case "completed": return workOrders.filter(j => completedStatuses.includes(j.status));
      default: return baseJobs;
    }
  }, [jobs, searchTerm, activeFilter, completedStatuses]);

  const handleCreateNewJob = (isQuote: boolean) => {
    navigateTo('jobDetail', {} as Job, null, { isQuote });
  };
  
  const MobileView = () => (
    <div className="space-y-4">
        <JobCardList jobs={filteredJobs} navigateTo={navigateTo} />
    </div>
  );
  
  const DesktopView = () => {
    const { allJobs, quotes, scheduled, unscheduled, completed } = useMemo(() => {
        const baseJobs = jobs.filter(job =>
          job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.jobId || job.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.vin?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return {
            allJobs: baseJobs,
            quotes: baseJobs.filter(j => j.isQuote),
            scheduled: baseJobs.filter(j => !j.isQuote && !!j.scheduledDate),
            unscheduled: baseJobs.filter(j => !j.isQuote && j.status === 'new' && !j.scheduledDate),
            completed: baseJobs.filter(j => !j.isQuote && completedStatuses.includes(j.status)),
        }
    }, [jobs, searchTerm, completedStatuses]);

    const tabs = [
        { value: "all", title: "All", data: allJobs },
        { value: "quotes", title: "Quotes", data: quotes },
        { value: "scheduled", title: "Scheduled", data: scheduled },
        { value: "unscheduled", title: "Unscheduled", data: unscheduled },
        { value: "completed", title: "Completed", data: completed },
    ];
    
    return (
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 md:grid-cols-5 gap-1">
              {tabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.title} ({tab.data.length})
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-4">
                <JobTable jobs={tab.data} navigateTo={navigateTo} />
              </TabsContent>
            ))}
        </Tabs>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex-1">
            <CardTitle>{userProfile?.role === 'technician' ? 'My Jobs' : 'All Jobs'}</CardTitle>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
            <Input
                placeholder="Search jobs..."
                className="flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            {isMobile && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="outline" size="icon"><Filter className="h-4 w-4"/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuRadioGroup value={activeFilter} onValueChange={(v) => setActiveFilter(v as JobFilter)}>
                           {sections.map(s => <DropdownMenuRadioItem key={s.value} value={s.value}>{s.title}</DropdownMenuRadioItem>)}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            {userProfile?.role !== 'technician' && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="hidden md:flex">
                            <Plus /> New Job
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleCreateNewJob(false)}>
                            New Work Order
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateNewJob(true)}>
                            New Quote
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center">Loading jobs...</p>
        ) : (
          isMobile ? <MobileView /> : <DesktopView />
        )}
      </CardContent>
    </Card>
  );
}
