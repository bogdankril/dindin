
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';
type ViewType = 'threeDay' | 'weekly' | 'monthly';

export default function ScheduleViewSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [defaultView, setDefaultView] = useState<ViewType>('threeDay');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/scheduleView`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setDefaultView(doc.data().defaultView || 'threeDay');
        }
        setLoading(false);
    }, (error) => {
        showAppModal(`Error fetching settings: ${error.message}`, 'destructive');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [db, userProfile?.id, showAppModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/scheduleView`);
    setDocumentNonBlocking(settingsRef, { defaultView }, { merge: true });
    showAppModal("Default schedule view saved successfully!");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading settings...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule View Settings</CardTitle>
        <CardDescription>Set the default view for the job schedule page.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="defaultView">Default View</Label>
            <Select value={defaultView} onValueChange={(value: ViewType) => setDefaultView(value)}>
                <SelectTrigger id="defaultView">
                    <SelectValue placeholder="Select a view" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="threeDay">3-Day View</SelectItem>
                    <SelectItem value="weekly">Weekly View</SelectItem>
                    <SelectItem value="monthly">Monthly View</SelectItem>
                </SelectContent>
            </Select>
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

