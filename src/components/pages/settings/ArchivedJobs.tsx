
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Job } from '@/lib/types';
import { formatDateTime } from '@/lib/dates';
import { ArchiveRestore, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function ArchivedJobs() {
  const { db, showAppModal, navigateTo, showCustomConfirmModal, unarchiveJob, permanentlyDeleteJobs, userProfile } = useAppContext();
  const [archivedJobs, setArchivedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const archivedJobsRef = useMemoFirebase(() => db && userProfile?.id ? collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/archivedJobs`) : null, [db, userProfile?.id]);

  useEffect(() => {
    if (!archivedJobsRef) {
        setArchivedJobs([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(archivedJobsRef, (snapshot) => {
        setArchivedJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching archived jobs: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [archivedJobsRef, showAppModal]);

  const filteredJobs = useMemo(() => {
    return archivedJobs.filter(job =>
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.vin?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [archivedJobs, searchTerm]);

  const handleRestore = (job: Job) => {
    showCustomConfirmModal(
        `Are you sure you want to restore Job #${job.jobId}? A new job ID will be assigned.`,
        () => unarchiveJob(job)
    );
  };
  
  const handleDeleteSelected = () => {
    showCustomConfirmModal(
        `Are you sure you want to permanently delete ${selectedJobIds.length} job(s)? This action cannot be undone.`,
        () => {
            permanentlyDeleteJobs(selectedJobIds);
            setSelectedJobIds([]);
        }
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedJobIds(filteredJobs.map(job => job.id));
    } else {
        setSelectedJobIds([]);
    }
  };

  const handleSelectOne = (jobId: string, checked: boolean) => {
    if (checked) {
        setSelectedJobIds(prev => [...prev, jobId]);
    } else {
        setSelectedJobIds(prev => prev.filter(id => id !== jobId));
    }
  }

  const ArchivedJobsContent = () => {
    if (loading) return <p className="text-muted-foreground text-center py-10">Loading archived jobs...</p>;
    if (filteredJobs.length === 0) return <p className="text-muted-foreground text-center py-10">No archived jobs found.</p>;
    return isMobile ? <MobileArchivedList /> : <DesktopArchivedList />;
  };

  const DesktopArchivedList = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                  checked={selectedJobIds.length > 0 && selectedJobIds.length === filteredJobs.length}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  aria-label="Select all"
              />
            </TableHead>
            <TableHead>Job ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Archived Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job) => (
            <TableRow key={job.id} data-state={selectedJobIds.includes(job.id) && "selected"}>
              <TableCell>
                <Checkbox
                    checked={selectedJobIds.includes(job.id)}
                    onCheckedChange={(checked) => handleSelectOne(job.id, checked as boolean)}
                    aria-label="Select row"
                />
              </TableCell>
              <TableCell className="font-medium">{job.jobId || job.id.substring(0, 6)}</TableCell>
              <TableCell>{job.customerName}</TableCell>
              <TableCell>{job.make} ${job.model} (${job.year})</TableCell>
              <TableCell>{formatDateTime(job.archivedAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleRestore(job)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const MobileArchivedList = () => (
    <div className="space-y-4">
      {filteredJobs.map((job) => (
        <Card key={job.id} data-state={selectedJobIds.includes(job.id) && "selected"} className="data-[state=selected]:bg-muted/50">
          <CardContent className="p-4 flex gap-4">
            <Checkbox
              className="mt-1"
              checked={selectedJobIds.includes(job.id)}
              onCheckedChange={(checked) => handleSelectOne(job.id, checked as boolean)}
              aria-label="Select job"
            />
            <div className="flex-grow space-y-3">
              <div>
                <p className="font-bold">{job.customerName}</p>
                <p className="text-sm text-muted-foreground">{job.make} ${job.model} (${job.year})</p>
                <p className="text-xs text-muted-foreground">ID: {job.jobId || job.id.substring(0, 6)}</p>
                <p className="text-xs text-muted-foreground">Archived: {formatDateTime(job.archivedAt)}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => handleRestore(job)}>
                  <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archived Jobs</CardTitle>
        <CardDescription>View and manage jobs that have been archived. Restore them to active status or permanently delete them.</CardDescription>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2 gap-2">
            <Input
              placeholder="Search archived jobs..."
              className="w-full md:max-w-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {selectedJobIds.length > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected}>
                    <Trash2 className="mr-2 h-4 w-4"/>
                    Delete Selected (${selectedJobIds.length})
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <ArchivedJobsContent />
      </CardContent>
      <CardFooter>
        <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Back to Settings</Button>
      </CardFooter>
    </Card>
  );
}
