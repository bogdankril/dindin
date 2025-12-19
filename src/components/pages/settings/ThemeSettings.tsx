
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ThemeSettings, ColorScheme } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

const colorSchemes: { id: ColorScheme, name: string; primary: string; accent: string; }[] = [
    { id: 'default', name: 'Default Blue', primary: 'hsl(202 100% 38%)', accent: 'hsl(202 100% 43%)' },
    { id: 'soft-blue', name: 'Soft Blue', primary: 'hsl(217 91% 60%)', accent: 'hsl(217 91% 65%)' },
    { id: 'gentle-green', name: 'Gentle Green', primary: 'hsl(145 58% 40%)', accent: 'hsl(145 58% 50%)' },
    { id: 'warm-neutral', name: 'Warm Neutral', primary: 'hsl(35 33% 58%)', accent: 'hsl(35 33% 68%)' },
    { id: 'muted-pink', name: 'Muted Pink', primary: 'hsl(340 40% 60%)', accent: 'hsl(340 40% 70%)' },
    { id: 'cool-gray', name: 'Cool Gray', primary: 'hsl(220 14% 45%)', accent: 'hsl(220 14% 55%)' },
    { id: 'deep-ocean', name: 'Deep Ocean', primary: 'hsl(208 100% 24%)', accent: 'hsl(208 100% 34%)' },
    { id: 'vibrant-blue', name: 'Vibrant Blue', primary: 'hsl(223 79% 48%)', accent: 'hsl(223 79% 58%)' },
];


export default function ThemeSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [settings, setSettings] = useState<ThemeSettings>({ colorScheme: 'default' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !userProfile?.id) return;

    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/theme`);
    const unsubscribe = onSnapshot(settingsRef, (doc) => {
        if (doc.exists()) {
            setSettings(doc.data() as ThemeSettings);
        }
        setLoading(false);
    }, () => setLoading(false));
    
    return () => unsubscribe();
  }, [db, userProfile?.id]);
  
  const handleColorChange = (colorScheme: ColorScheme) => {
    setSettings(prev => ({ ...prev, colorScheme }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/theme`);
    setDocumentNonBlocking(settingsRef, settings, { merge: true });
    showAppModal("Theme settings saved successfully!");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading theme settings...</p>;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Theme &amp; Appearance</CardTitle>
          <CardDescription>Choose a color scheme to customize the look and feel of the entire application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <h3 className="text-lg font-semibold mb-4">Color Scheme</h3>
                 <RadioGroup
                    value={settings.colorScheme || 'default'}
                    onValueChange={(value: ColorScheme) => handleColorChange(value)}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
                >
                    {colorSchemes.map((scheme) => (
                    <Label
                        key={scheme.id}
                        htmlFor={scheme.id}
                        className={cn(
                        "block cursor-pointer rounded-lg border-2 p-4 transition-all",
                        settings.colorScheme === scheme.id
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-primary/50"
                        )}
                    >
                        <div className="flex items-center">
                            <RadioGroupItem value={scheme.id} id={scheme.id} />
                            <div className="ml-3 flex items-center gap-2">
                               <div className="h-4 w-4 rounded-full" style={{ backgroundColor: scheme.primary }} />
                               <p className="font-semibold">{scheme.name}</p>
                            </div>
                        </div>
                    </Label>
                    ))}
                </RadioGroup>
            </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

