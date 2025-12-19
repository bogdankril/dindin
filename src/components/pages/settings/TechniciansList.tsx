"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Technician } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function TechniciansList() {
  const { db, showAppModal, showCustomConfirmModal, navigateTo, setShowNewUserModal, userProfile } = useAppContext();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) {
        setLoading(false);
        return;
    };

    const techsRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/technicians`);
    const unsubscribe = onSnapshot(techsRef, (snapshot) => {
        setTechnicians(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Technician)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching technicians: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userProfile?.id, showAppModal]);
  
  const handleAddNewTechnician = () => {
    setShowNewUserModal(true);
  }

  const handleDeleteTechnician = (technician: Technician) => {
    showCustomConfirmModal(
      `Are you sure you want to delete the technician "${technician.name}"? If they are an active user, their login will remain, but their technician record will be removed.`,
      async () => {
        if (!db || !userProfile?.id) return;
        try {
            const docRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/technicians`, technician.id);
            deleteDocumentNonBlocking(docRef);
            showAppModal('Technician record deleted.');
        } catch (error: any) {
            showAppModal(`Error deleting technician: ${error.message}`, 'destructive');
        }
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Technicians</CardTitle>
          <CardDescription>View all technicians. To add a new technician, use the User Management console.</CardDescription>
        </div>
        <Button onClick={handleAddNewTechnician}>
          <Plus className="mr-2 h-4 w-4" /> Add New Technician
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center">Loading technicians...</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center h-24">No technicians found.</TableCell></TableRow>
                ) : (
                  technicians.map((tech) => (
                    <TableRow key={tech.id}>
                      <TableCell className="font-medium">{tech.name}</TableCell>
                      <TableCell>{tech.email}</TableCell>
                      <TableCell>{tech.phone}</TableCell>
                      <TableCell>
                        <Badge variant={tech.userId ? 'default' : 'secondary'}>
                          {tech.userId ? 'Active User' : 'Invited'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTechnician(tech)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => navigateTo('settings')}>Back to Settings</Button>
      </CardFooter>
    </Card>
  );
}
