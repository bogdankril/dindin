
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import type { ItemCode } from '@/lib/types';

const APP_ID = 'glass-pro-3a83';

export default function ItemCodeSettings() {
  const { db, showAppModal, showCustomConfirmModal, navigateTo, userProfile } = useAppContext();
  const [itemCodes, setItemCodes] = useState<ItemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<ItemCode>>({ code: '', description: '', price: 0, cost: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const itemCodesRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/itemCodes`);
    const unsubscribe = onSnapshot(itemCodesRef, (snapshot) => {
        setItemCodes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemCode)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching item codes: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, showAppModal, userProfile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value }));
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    if (!formData.code || !formData.description) return showAppModal("Code and Description are required", "destructive");
    
    const collectionRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/itemCodes`);
    
    if (isEditing && formData.id) {
        const docRef = doc(collectionRef, formData.id);
        const { id, ...dataToUpdate } = formData;
        updateDocumentNonBlocking(docRef, dataToUpdate);
        showAppModal("Item code updated successfully.");
    } else {
        addDocumentNonBlocking(collectionRef, formData);
        showAppModal("Item code added successfully.");
    }
    handleCancelEdit();
  };

  const handleEditClick = (item: ItemCode) => {
    setIsEditing(true);
    setFormData(item);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ code: '', description: '', price: 0, cost: 0 });
  };
  
  const handleDeleteItemCode = (item: ItemCode) => {
    if (!db || !userProfile?.id) return;
    showCustomConfirmModal(`Delete item code "${item.description}"?`, () => {
        const docRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/itemCodes`, item.id);
        deleteDocumentNonBlocking(docRef);
        showAppModal("Item code deleted.");
    });
  };
  
  const ItemCodesContent = () => {
    if (loading) return <p className="text-center py-10">Loading...</p>;
    if (itemCodes.length === 0) return <p className="text-center py-10">No item codes found.</p>;
    return isMobile ? <MobileItemCodeList /> : <DesktopItemCodeList />;
  };

  const DesktopItemCodeList = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow><TableHead>Code</TableHead><TableHead>Description</TableHead><TableHead>Price</TableHead><TableHead>Cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {itemCodes.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.code}</TableCell><TableCell>{item.description}</TableCell>
              <TableCell>${(item.price || 0).toFixed(2)}</TableCell><TableCell>${(item.cost || 0).toFixed(2)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItemCode(item)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const MobileItemCodeList = () => (
      <div className="space-y-4">
        {itemCodes.map(item => (
            <Card key={item.id}>
                <CardContent className="p-4 space-y-3">
                    <div>
                        <p className="font-bold text-lg">{item.description}</p>
                        <p className="text-sm text-muted-foreground">Code: {item.code}</p>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <p>Price: <span className="font-medium">${(item.price || 0).toFixed(2)}</span></p>
                        <p>Cost: <span className="font-medium">${(item.cost || 0).toFixed(2)}</span></p>
                    </div>
                    <div className="flex justify-end space-x-2 border-t pt-3">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItemCode(item)}>Delete</Button>
                    </div>
                </CardContent>
            </Card>
        ))}
      </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Item Code' : 'Add New Item Code'}</CardTitle>
          <CardDescription>Manage pre-defined glass and service item codes for quick job creation.</CardDescription>
        </CardHeader>
        <form onSubmit={handleFormSubmit}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2"><Label>Code *</Label><Input name="code" value={formData.code || ''} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label>Description *</Label><Input name="description" value={formData.description || ''} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label>Price ($)</Label><Input name="price" type="number" step="0.01" value={formData.price || 0} onChange={handleInputChange} /></div>
            <div className="space-y-2"><Label>Cost ($)</Label><Input name="cost" type="number" step="0.01" value={formData.cost || 0} onChange={handleInputChange} /></div>
            <div className="flex items-center space-x-2">
              <Button type="submit">{isEditing ? 'Save Changes' : 'Add Code'}</Button>
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
            </div>
          </CardContent>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Item Code List</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemCodesContent />
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => navigateTo('settings')}>Back to Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

