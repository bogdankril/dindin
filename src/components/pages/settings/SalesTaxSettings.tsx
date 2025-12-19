
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function SalesTaxSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [taxRate, setTaxRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/salesTax`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setTaxRate(doc.data().rate || 0);
        }
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching tax rate: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userProfile?.id, showAppModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/salesTax`);
    setDocumentNonBlocking(settingsRef, { rate: taxRate }, { merge: true });
    showAppModal("Sales tax rate saved successfully!");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading sales tax settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Tax Settings</CardTitle>
        <CardDescription>Set the sales tax rate to be applied to jobs.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Sales Tax Rate (%)</Label>
            <Input
              id="taxRate"
              name="taxRate"
              type="number"
              step="0.0001"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Cancel</Button>
          <Button type="submit">Save Tax Rate</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

