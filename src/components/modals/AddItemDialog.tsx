
"use client";

import { useState, useEffect } from 'react';
import type { JobItem, ItemCode, InventoryItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface AddItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: JobItem, index: number | null) => void;
  itemToEdit: JobItem | null;
  editingIndex: number | null;
  defaultItemCodes: ItemCode[];
  inventoryItems: InventoryItem[];
}

const getInitialState = (): Omit<JobItem, 'id'> => ({
  description: '',
  quantity: 1,
  price: 0,
  discountType: '$',
  discountValue: 0,
  inventoryId: undefined,
});

export default function AddItemDialog({
  isOpen,
  onOpenChange,
  onSave,
  itemToEdit,
  editingIndex,
  defaultItemCodes,
  inventoryItems
}: AddItemDialogProps) {
  const { toast } = useToast();
  const [newItem, setNewItem] = useState<Omit<JobItem, 'id'>>(getInitialState());

  const [itemCodeSearchTerm, setItemCodeSearchTerm] = useState('');
  const [filteredItemCodeSuggestions, setFilteredItemCodeSuggestions] = useState<ItemCode[]>([]);
  const [showItemCodeSuggestions, setShowItemCodeSuggestions] = useState(false);

  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventorySuggestions, setInventorySuggestions] = useState<InventoryItem[]>([]);
  const [showInventorySuggestions, setShowInventorySuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setNewItem(itemToEdit);
        setItemCodeSearchTerm(itemToEdit.description);
        setInventorySearchTerm(itemToEdit.description);
      } else {
        setNewItem(getInitialState());
        setItemCodeSearchTerm('');
        setInventorySearchTerm('');
      }
    }
  }, [isOpen, itemToEdit]);

  useEffect(() => {
    if (itemCodeSearchTerm.length > 0) {
      setFilteredItemCodeSuggestions(defaultItemCodes.filter(item =>
        item.code.toLowerCase().includes(itemCodeSearchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(itemCodeSearchTerm.toLowerCase())
      ).slice(0, 5));
      setShowItemCodeSuggestions(true);
    } else {
      setShowItemCodeSuggestions(false);
    }
  }, [itemCodeSearchTerm, defaultItemCodes]);
  
  useEffect(() => {
    if (inventorySearchTerm.length > 1) {
        const search = inventorySearchTerm.toLowerCase();
        const suggestions = inventoryItems.filter(item => 
            (item.partNumber.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search)) &&
            item.quantity > 0
        ).slice(0, 5);
        setInventorySuggestions(suggestions);
        setShowInventorySuggestions(suggestions.length > 0);
    } else {
        setShowInventorySuggestions(false);
    }
  }, [inventorySearchTerm, inventoryItems]);

  const handleItemCodeSelect = (itemCode: ItemCode) => {
    setShowItemCodeSuggestions(false);
    setNewItem(prev => ({
      ...prev,
      description: itemCode.description,
      price: itemCode.price,
    }));
    setItemCodeSearchTerm(itemCode.description);
  };
  
  const handleInventorySelect = (item: InventoryItem) => {
    setShowInventorySuggestions(false);
    setNewItem(prev => ({
      ...prev,
      description: item.partNumber,
      price: item.price,
      inventoryId: item.id,
    }));
    setInventorySearchTerm(item.partNumber);
  };

  const handleSave = () => {
    if (!newItem.description || !newItem.quantity || newItem.quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Item description and a valid quantity are required.',
      });
      return;
    }
    onSave(newItem, editingIndex);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingIndex !== null ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>Add a part or service to the job.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
            <div className="relative">
              <Label htmlFor="item-code-search">Search Item Codes</Label>
              <Input 
                id="item-code-search"
                value={itemCodeSearchTerm} 
                onChange={e => setItemCodeSearchTerm(e.target.value)} 
                onFocus={() => setShowItemCodeSuggestions(true)} 
                onBlur={() => setTimeout(() => setShowItemCodeSuggestions(false), 200)} 
                placeholder="Search by code or description..." 
              />
              {showItemCodeSuggestions && filteredItemCodeSuggestions.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 shadow-lg">
                  <CardContent className="p-2 space-y-1 max-h-52 overflow-y-auto">
                    {filteredItemCodeSuggestions.map((item: ItemCode) => (
                      <div key={item.id} onMouseDown={() => handleItemCodeSelect(item)} className="p-2 cursor-pointer hover:bg-muted rounded-md text-sm">
                        <p className="font-semibold">{item.description} ({item.code})</p>
                        <p className="text-muted-foreground">${(item.price || 0).toFixed(2)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="relative space-y-2">
              <Label>Part Number / Description</Label>
              <Input 
                value={newItem.description} 
                onChange={e => {
                  setNewItem(p => ({...p, description: e.target.value}));
                  setInventorySearchTerm(e.target.value);
                }} 
                onBlur={() => setTimeout(() => setShowInventorySuggestions(false), 200)}
                required
              />
              {showInventorySuggestions && inventorySuggestions.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 shadow-lg">
                  <CardHeader className="p-2 border-b"><CardTitle className="text-sm">From Inventory</CardTitle></CardHeader>
                  <CardContent className="p-2 space-y-1 max-h-52 overflow-y-auto">
                    {inventorySuggestions.map((item: InventoryItem) => (
                      <div key={item.id} onClick={() => handleInventorySelect(item)} className="p-2 cursor-pointer hover:bg-muted rounded-md text-sm">
                        <p className="font-semibold">{item.partNumber} - {item.description}</p>
                        <p className="text-muted-foreground">In Stock: {item.quantity}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({...p, quantity: parseFloat(e.target.value) || 1}))} />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input type="number" value={newItem.price ?? ''} onChange={e => setNewItem(p => ({...p, price: parseFloat(e.target.value) || 0}))} placeholder="0.00"/>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="space-y-2 flex-grow">
                <Label>Discount</Label>
                <Input type="number" value={newItem.discountValue || 0} onChange={e => setNewItem(p => ({...p, discountValue: parseFloat(e.target.value) || 0}))} />
              </div>
              <Select value={newItem.discountType} onValueChange={(v) => setNewItem(p => ({...p, discountType: v as '$' | '%'}))}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="$">$</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave}>
            {editingIndex !== null ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {editingIndex !== null ? 'Save Item' : 'Add Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
