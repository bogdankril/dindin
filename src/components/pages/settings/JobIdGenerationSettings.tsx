
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { JobIdSettings } from '@/lib/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

const defaultSettings: JobIdSettings = {
  prefix: 'W',
  nextJobNumber: 1001,
  quotePrefix: 'Q',
  nextQuoteNumber: 101,
};

export default function JobIdGenerationSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [settings, setSettings] = useState<JobIdSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/jobIdGeneration`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as JobIdSettings);
        } else {
            setSettings(defaultSettings);
        }
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching settings: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userProfile?.id, showAppModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'number' ? (parseInt(value, 10) || 0) : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/jobIdGeneration`);
    setDocumentNonBlocking(settingsRef, settings, { merge: true });
    showAppModal("Job ID settings saved successfully!");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job & Quote ID Generation</CardTitle>
        <CardDescription>Customize how new Job and Quote IDs are generated.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold">Work Order Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="prefix">Work Order Prefix</Label>
              <Input id="prefix" name="prefix" value={settings.prefix || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextJobNumber">Next Available Work Order #</Label>
              <Input id="nextJobNumber" name="nextJobNumber" type="number" min="1" value={settings.nextJobNumber} onChange={handleChange} />
            </div>
             <div className="text-muted-foreground text-sm">
                Example Work Order ID: {settings.prefix}{String(settings.nextJobNumber).padStart(4, '0')}
            </div>
          </div>
          <div className="space-y-4 p-4 border rounded-md">
            <h3 className="font-semibold">Quote Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="quotePrefix">Quote Prefix</Label>
              <Input id="quotePrefix" name="quotePrefix" value={settings.quotePrefix || ''} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nextQuoteNumber">Next Available Quote #</Label>
              <Input id="nextQuoteNumber" name="nextQuoteNumber" type="number" min="1" value={settings.nextQuoteNumber} onChange={handleChange} />
            </div>
             <div className="text-muted-foreground text-sm">
                Example Quote ID: {settings.quotePrefix}{String(settings.nextQuoteNumber).padStart(4, '0')}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Cancel</Button>
          <Button type="submit">Save Settings</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

