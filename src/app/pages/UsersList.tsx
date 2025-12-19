
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { UserProfile, UserRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';

export default function UsersList() {
  const { db, userProfile: currentUserProfile, showAppModal, navigateTo, setShowNewUserModal, showCustomConfirmModal } = useAppContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const currentUserId = currentUserProfile?.uid;

  useEffect(() => {
    if (!db || !currentUserProfile?.companyId) {
        setLoading(false);
        return;
    };

    const usersQuery = query(
      collection(db, 'users'),
      where('companyId', '==', currentUserProfile.companyId)
    );

    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching users: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUserProfile?.companyId, showAppModal]);

  const handleRoleChange = async (userIdToChange: string, newRole: UserRole) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', userIdToChange);
    try {
        await updateDoc(userDocRef, { role: newRole });
        showAppModal('User role updated successfully.');
    } catch (error) {
        showAppModal('Failed to update user role.', 'destructive');
    }
  };

  const handleDeleteUser = (userToDelete: UserProfile) => {
    showCustomConfirmModal(
        `Are you sure you want to permanently delete the user ${userToDelete.email}? This action cannot be undone.`,
        () => {
            showAppModal("User deletion is a sensitive operation and has been disabled in this demo.", "default");
        }
    );
  };
  
  const UserListContent = () => {
      if (loading) {
        return <p className="text-muted-foreground text-center py-10">Loading users...</p>;
      }
      if (users.length === 0) {
        return <p className="text-muted-foreground text-center py-10">No users found.</p>;
      }
      
      return isMobile ? <MobileUserList /> : <DesktopUserList />;
  };

  const DesktopUserList = () => (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={user.uid === currentUserId}>Change Role</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      >
                        <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteUser(user)} 
                      disabled={user.uid === currentUserId}
                  >
                      <Trash2 className="h-4 w-4"/>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  );
  
  const MobileUserList = () => (
      <div className="space-y-4">
          {users.map(user => (
              <Card key={user.id}>
                  <CardContent className="p-4 space-y-3">
                      <div>
                          <p className="font-bold text-lg">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex justify-between items-center">
                         <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                            {user.role}
                         </Badge>
                          <div className="space-x-1">
                               <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" disabled={user.uid === currentUserId}>Change Role</Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuRadioGroup
                                      value={user.role}
                                      onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                                    >
                                      <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="member">Member</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                 <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    onClick={() => handleDeleteUser(user)} 
                                    disabled={user.uid === currentUserId}
                                >
                                    <Trash2 className="h-4 w-4"/>
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
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create, manage roles, and delete user accounts.</CardDescription>
        </div>
        <Button onClick={() => setShowNewUserModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </CardHeader>
      <CardContent>
        <UserListContent />
      </CardContent>
       <CardFooter>
            <Button variant="outline" onClick={() => navigateTo('settings')}>Back to Settings</Button>
        </CardFooter>
    </Card>
  );
}
