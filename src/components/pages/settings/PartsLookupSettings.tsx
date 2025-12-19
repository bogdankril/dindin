
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

// In a real app, these would be encrypted/stored securely.
// For this demo, we store them in Firestore for simplicity.
interface SupplierCredentials {
  mygrantUsername?: string;
  mygrantPassword?: string;
  mygrantCustomerId?: string;
}

export default function PartsLookupSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [credentials, setCredentials] = useState<SupplierCredentials>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/partsLookup`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setCredentials(doc.data() as SupplierCredentials);
        }
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, [db, showAppModal, userProfile?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/partsLookup`);
    setDocumentNonBlocking(settingsRef, credentials, { merge: true });
    showAppModal("Credentials saved successfully. Note: This is a demo and credentials are not encrypted.");
  };
  
  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parts Lookup Settings</CardTitle>
        <CardDescription>
          Configure your credentials for real-time parts lookup with suppliers.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md">
            <h3 className="text-lg font-semibold mb-4">Mygrant Glass</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mygrantUsername">Mygrant Username</Label>
                <Input id="mygrantUsername" name="mygrantUsername" value={credentials.mygrantUsername || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mygrantPassword">Mygrant Password</Label>
                <Input id="mygrantPassword" name="mygrantPassword" type="password" value={credentials.mygrantPassword || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mygrantCustomerId">Mygrant Customer ID</Label>
                <Input id="mygrantCustomerId" name="mygrantCustomerId" value={credentials.mygrantCustomerId || ''} onChange={handleChange} placeholder="e.g., C123456-001" />
              </div>
            </div>
          </div>
          {/* Placeholder for other suppliers */}
          <div className="p-4 border rounded-md border-dashed">
            <h3 className="text-lg font-semibold text-muted-foreground">PGW / Pilkington (Coming Soon)</h3>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Cancel</Button>
          <Button type="submit">Save Credentials</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

