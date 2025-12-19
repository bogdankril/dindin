
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, serverTimestamp, doc } from 'firebase/firestore';
import type { InventoryItem } from '@/lib/types';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function GlassInventory() {
  const { db, showAppModal, showCustomConfirmModal, navigateTo, userProfile } = useAppContext();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<InventoryItem>>({ partNumber: '', description: '', quantity: 0, cost: 0, price: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const inventoryRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/inventory`);
    const unsubscribe = onSnapshot(inventoryRef, (snapshot) => {
        setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching inventory: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, showAppModal, userProfile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    if (!formData.partNumber || !formData.description) return showAppModal("Part Number and Description are required", "destructive");
    
    const collectionRef = collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/inventory`);
    if (isEditing && formData.id) {
        const docRef = doc(collectionRef, formData.id);
        const { id, ...dataToUpdate } = formData;
        updateDocumentNonBlocking(docRef, { ...dataToUpdate, updatedAt: serverTimestamp() });
        showAppModal("Item updated successfully.", "default");
    } else {
        addDocumentNonBlocking(collectionRef, { ...formData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        showAppModal("Item added successfully.", "default");
    }

    handleCancelEdit();
  };
  
  const handleEditClick = (item: InventoryItem) => {
    setIsEditing(true);
    setFormData(item);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ partNumber: '', description: '', quantity: 0, cost: 0, price: 0 });
  };
  
  const handleDeleteItem = (item: InventoryItem) => {
    showCustomConfirmModal(
      `Are you sure you want to delete ${item.description}?`,
      async () => {
        if (!db || !userProfile?.id) return;
        const docRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/inventory`, item.id);
        deleteDocumentNonBlocking(docRef);
        showAppModal("Item deleted.", "default");
      }
    );
  };

  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item =>
      item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventoryItems, searchTerm]);

  const InventoryContent = () => {
    if (loading) return <p className="text-center py-10">Loading...</p>;
    if (filteredItems.length === 0) return <p className="text-center py-10">No items found.</p>;
    return isMobile ? <MobileInventoryList /> : <DesktopInventoryList />;
  };

  const DesktopInventoryList = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part Number</TableHead><TableHead>Description</TableHead><TableHead>Qty</TableHead>
            <TableHead>Cost</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.partNumber}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className={item.quantity < 5 ? 'text-destructive font-bold' : ''}>{item.quantity}</TableCell>
              <TableCell>${(item.cost || 0).toFixed(2)}</TableCell>
              <TableCell>${(item.price || 0).toFixed(2)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>Edit</Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItem(item)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const MobileInventoryList = () => (
    <div className="space-y-4">
      {filteredItems.map(item => (
        <Card key={item.id}>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="font-bold text-lg">{item.description}</p>
              <p className="text-sm text-muted-foreground">Part #: {item.partNumber}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p>Qty: <span className={item.quantity < 5 ? 'text-destructive font-bold' : ''}>{item.quantity}</span></p>
              <p>Price: <span className="font-medium">${(item.price || 0).toFixed(2)}</span></p>
              <p>Cost: <span className="font-medium">${(item.cost || 0).toFixed(2)}</span></p>
            </div>
            <div className="flex justify-end space-x-2 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteItem(item)}>Delete</Button>
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
          <CardTitle>{isEditing ? 'Edit Inventory Item' : 'Add New Inventory Item'}</CardTitle>
        </CardHeader>
        <form onSubmit={handleFormSubmit}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="space-y-2"><Label>Part Number *</Label><Input name="partNumber" value={formData.partNumber || ''} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label>Description *</Label><Input name="description" value={formData.description || ''} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label>Quantity *</Label><Input name="quantity" type="number" value={formData.quantity || 0} onChange={handleInputChange} required /></div>
            <div className="space-y-2"><Label>Cost ($)</Label><Input name="cost" type="number" step="0.01" value={formData.cost || 0} onChange={handleInputChange} /></div>
            <div className="space-y-2"><Label>Price ($)</Label><Input name="price" type="number" step="0.01" value={formData.price || 0} onChange={handleInputChange} /></div>
            <div className="flex items-center space-x-2">
              <Button type="submit">{isEditing ? 'Save Changes' : 'Add Item'}</Button>
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
            </div>
          </CardContent>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <Input placeholder="Search inventory..." className="max-w-sm mt-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </CardHeader>
        <CardContent>
          <InventoryContent />
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={() => navigateTo('dashboard')}>Back to Dashboard</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

