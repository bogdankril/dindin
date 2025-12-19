
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Building2, Upload } from 'lucide-react';
import type { BusinessProfile } from '@/lib/types';
import { formatPhoneNumber } from '@/lib/utils';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { setDocumentNonBlocking } from '@/firebase';

const APP_ID = 'glass-pro-3a83';
const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

export default function BusinessProfileSettings() {
    const { db, storage, showAppModal, navigateTo, userProfile, isMapsApiReady } = useAppContext();
    const [profile, setProfile] = useState<Partial<BusinessProfile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const addressInputRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    const setupAutocomplete = useCallback(() => {
        if (isMapsApiReady && addressInputRef.current) {
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
    
            const autocomplete = new window.google.maps.places.Autocomplete(
                addressInputRef.current,
                {
                    types: ["address"],
                    componentRestrictions: { country: 'us' },
                    fields: ['formatted_address']
                }
            );
            autocompleteRef.current = autocomplete;
        
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place && place.formatted_address) {
                    setProfile(prev => ({ ...prev, address: place.formatted_address }));
                }
            });
        }
    }, [isMapsApiReady]);

    useEffect(() => {
        if (!db || !userProfile?.uid) return;

        setLoading(true);
        const profileRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.uid}/settings/businessProfile`);
        const unsubscribe = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as BusinessProfile;
                setProfile(data);
                setLogoPreview(data.logoUrl || null);
            }
            setLoading(false);
            setTimeout(() => {
                setupAutocomplete();
            }, 100);
        }, (error) => {
            showAppModal(`Error fetching business profile: ${error.message}`, 'destructive');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, userProfile?.uid, showAppModal, setupAutocomplete]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            setProfile({ ...profile, [name]: formatPhoneNumber(value) });
        } else {
            setProfile({ ...profile, [name]: value });
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_LOGO_SIZE_BYTES) {
                showAppModal(`File is too large. The maximum logo size is ${MAX_LOGO_SIZE_MB}MB.`, 'destructive');
                setLogoFile(null);
                setLogoPreview(profile.logoUrl || null);
                e.target.value = '';
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = async () => {
        if (!db || !storage || !userProfile) return showAppModal("Not authenticated.", "destructive");
        if (!profile.name) return showAppModal("Company Name is required", "destructive");

        setSaving(true);
        let logoUrl = profile.logoUrl || '';

        try {
            if (logoFile) {
                const storageRef = ref(storage, `logos/${userProfile.uid}/${logoFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, logoFile);

                logoUrl = await new Promise<string>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => {
                            console.error("Upload failed", error);
                            reject(error);
                        },
                        async () => {
                            try {
                                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                                resolve(downloadURL);
                            } catch (getUrlError) {
                                reject(getUrlError);
                            }
                        }
                    );
                });
            }

            const profileRef = doc(db, `artifacts/${APP_ID}/users/${userProfile.uid}/settings/businessProfile`);
            const dataToSave = {
                ...profile,
                logoUrl,
                updatedAt: serverTimestamp(),
            };

            await setDoc(profileRef, dataToSave, { merge: true });

            showAppModal("Business profile updated successfully!");
            setLogoFile(null);
            setUploadProgress(0);

        } catch (error) {
             console.error("Failed to save profile:", error);
             showAppModal("Failed to save profile.", "destructive");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p>Loading business profile...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Update your company's information. This will be used on work orders and quotes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Avatar className="h-24 w-24 rounded-md">
                            <AvatarImage src={logoPreview || undefined} alt="Company Logo" className="object-contain" />
                            <AvatarFallback className="rounded-md">
                                <Building2 className="h-12 w-12 text-muted-foreground" />
                            </AvatarFallback>
                        </Avatar>
                        <Input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoFileChange} className="hidden" />
                        <div className="flex flex-col w-full max-w-xs items-center gap-2">
                            <Button type="button" variant="outline" onClick={() => document.getElementById('logo-upload')?.click()} className="w-full">
                                <Upload className="mr-2 h-4 w-4" />
                                {logoFile ? 'Change Selection' : 'Select Logo'}
                            </Button>
                            {saving && logoFile && (
                                <Progress value={uploadProgress} className="w-full h-2" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Recommended: Square image (PNG, JPG) under ${MAX_LOGO_SIZE_MB}MB.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        <Input id="name" name="name" value={profile.name || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                        id="address"
                        name="address"
                        ref={addressInputRef}
                        className="w-full"
                        defaultValue={profile.address || ''}
                        onChange={handleInputChange}
                        placeholder={isMapsApiReady ? "Start typing to autocomplete..." : "Address autocomplete unavailable"}
                        disabled={!isMapsApiReady}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" value={profile.phone || ''} onChange={handleInputChange} placeholder="(xxx) xxx-xxxx" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" name="website" value={profile.website || ''} onChange={handleInputChange} />
                </div>
            </CardContent>

            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigateTo('settings')}>Cancel</Button>
                <Button onClick={handleSaveChanges} disabled={saving}>
                    {saving ? (logoFile ? 'Saving & Uploading...' : 'Saving...') : 'Save Changes'}
                </Button>
            </CardFooter>
        </Card>
    );
}
