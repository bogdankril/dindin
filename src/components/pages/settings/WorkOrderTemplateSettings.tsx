
"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ThemeSettings } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { doc, onSnapshot } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

const SimplisticPreview = () => (
    <div className="bg-white p-2 border aspect-[400/518] w-full h-auto text-black">
        <div className="flex justify-between items-start">
            <div className="w-1/2 space-y-1">
                <div className="h-2 w-16 bg-gray-300 rounded-sm"></div>
                <div className="h-1.5 w-24 bg-gray-200 rounded-sm"></div>
                <div className="h-1.5 w-20 bg-gray-200 rounded-sm"></div>
            </div>
            <div className="w-1/3 text-right space-y-1">
                <div className="h-2.5 w-full bg-[hsl(var(--primary))] rounded-sm"></div>
                <div className="h-1.5 w-full bg-gray-200 rounded-sm"></div>
            </div>
        </div>
        <div className="h-px bg-gray-200 my-2"></div>
        <div className="h-2 w-20 bg-gray-300 rounded-sm mb-1"></div>
        <div className="h-1.5 w-full bg-gray-200 rounded-sm mb-0.5"></div>
        <div className="h-1.5 w-full bg-gray-200 rounded-sm"></div>
        <div className="h-px bg-gray-200 my-2"></div>
        <div className="space-y-1 mt-2">
            <div className="h-4 w-full bg-gray-300 rounded-sm"></div>
            <div className="h-4 w-full bg-gray-200 rounded-sm"></div>
            <div className="h-4 w-full bg-gray-200 rounded-sm"></div>
        </div>
    </div>
);

const ModernPreview = () => (
    <div className="bg-white p-2 border aspect-[400/518] w-full h-auto text-black">
        <div className="flex justify-between items-center">
            <div className="h-6 w-16 bg-[hsl(var(--primary))] opacity-20 rounded"></div>
            <div className="text-right space-y-1">
                <div className="h-3 w-24 bg-[hsl(var(--primary))] rounded-sm"></div>
                <div className="h-2 w-20 bg-gray-300 rounded-sm ml-auto"></div>
            </div>
        </div>
        <div className="h-px bg-gray-200 my-2"></div>
        <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
                <div className="h-2 w-12 bg-[hsl(var(--primary))] rounded-sm"></div>
                <div className="h-1.5 w-full bg-gray-200 rounded-sm"></div>
                <div className="h-1.5 w-5/6 bg-gray-200 rounded-sm"></div>
            </div>
            <div className="space-y-1">
                <div className="h-2 w-12 bg-gray-300 rounded-sm"></div>
                <div className="h-1.5 w-full bg-gray-200 rounded-sm"></div>
            </div>
        </div>
        <div className="space-y-1 mt-3">
            <div className="h-5 w-full bg-[hsl(var(--primary))] rounded text-white flex items-center p-1 justify-between">
                <div className="h-1.5 w-1/3 bg-white/80 rounded-sm"></div>
                <div className="h-1.5 w-1/6 bg-white/80 rounded-sm"></div>
            </div>
            <div className="h-5 w-full bg-white rounded flex items-center p-1 justify-between">
                <div className="h-1.5 w-1/3 bg-gray-200 rounded-sm"></div>
                <div className="h-1.5 w-1/6 bg-gray-200 rounded-sm"></div>
            </div>
        </div>
         <div className="h-px bg-gray-200 my-2"></div>
         <div className="flex justify-end">
            <div className="w-1/3 space-y-1">
                 <div className="h-2 w-full bg-gray-300 rounded-sm"></div>
                 <div className="h-2.5 w-full bg-[hsl(var(--primary))] opacity-20 rounded-sm"></div>
            </div>
         </div>
    </div>
);

const InformativePreview = () => (
     <div className="bg-white p-2 border aspect-[400/518] w-full h-auto text-black">
        {/* Header */}
        <div className="text-center mb-2">
            <div className="h-6 w-16 bg-gray-200 rounded mx-auto mb-1"></div>
            <div className="h-3 w-1/3 bg-gray-400 rounded-sm mx-auto mb-1"></div>
            <div className="h-2 w-2/3 bg-gray-300 rounded-sm mx-auto"></div>
            <div className="h-4 w-full border-y-2 border-[hsl(var(--primary))] my-1"></div>
        </div>
        <div className="grid grid-cols-3 gap-1 mb-2">
            <div className="h-4 bg-gray-100 rounded-sm"></div>
            <div className="h-4 bg-gray-100 rounded-sm"></div>
            <div className="h-4 bg-gray-100 rounded-sm"></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="h-8 bg-gray-200 rounded-sm"></div>
            <div className="h-8 bg-gray-200 rounded-sm"></div>
        </div>
        <div className="h-2 w-1/4 bg-gray-300 rounded-sm mb-1"></div>
        <div className="space-y-1">
            <div className="h-3 w-full bg-gray-200 rounded-sm"></div>
            <div className="h-3 w-full bg-gray-200 rounded-sm"></div>
        </div>
    </div>
);


const templates = [
  { id: 'simplistic', name: 'Simplistic', preview: <SimplisticPreview /> },
  { id: 'modern', name: 'Modern', preview: <ModernPreview /> },
  { id: 'informative', name: 'Informative', preview: <InformativePreview /> },
];

export default function WorkOrderTemplateSettings() {
  const { db, showAppModal, navigateTo, userProfile } = useAppContext();
  const [settings, setSettings] = useState<ThemeSettings>({ template: 'modern' });
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
  
  const handleTemplateChange = (templateId: 'simplistic' | 'modern' | 'informative') => {
    setSettings(prev => ({ ...prev, template: templateId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !userProfile?.id) return;
    const settingsRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/theme`);
    setDocumentNonBlocking(settingsRef, settings, { merge: true });
    showAppModal("Template settings saved successfully!");
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading template settings...</p>;
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Work Order &amp; Quote Template</CardTitle>
          <CardDescription>Choose a template for all generated work orders and quotes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div>
                <RadioGroup
                    value={settings.template}
                    onValueChange={handleTemplateChange}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    {templates.map((template) => (
                    <Label
                        key={template.id}
                        htmlFor={template.id}
                        className={cn(
                        "block cursor-pointer rounded-lg border-2 p-2 transition-all",
                        settings.template === template.id
                            ? "border-primary ring-2 ring-primary"
                            : "border-border hover:border-primary/50"
                        )}
                    >
                        <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                        {template.preview}
                        <p className="text-center font-semibold mt-2">{template.name}</p>
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

