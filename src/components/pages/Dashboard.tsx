
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Job, Customer, InventoryItem } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useMemoFirebase } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function Dashboard() {
  const { db, showAppModal, navigateTo, userProfile, businessProfile, isMapsApiReady, isAuthReady, isDataLoaded: isAppContextDataLoaded } = useAppContext();
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [dataLoaded, setDataLoaded] = useState({ jobs: false, customers: false, inventory: false });

  const loading = useMemo(() => !isAppContextDataLoaded || !Object.values(dataLoaded).every(Boolean), [isAppContextDataLoaded, dataLoaded]);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const jobsQuery = useMemoFirebase(() => db && userProfile?.id ? query(collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/jobs`), where('archivedAt', '==', null)) : null, [db, userProfile?.id]);
  const customersQuery = useMemoFirebase(() => db && userProfile?.id ? collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`) : null, [db, userProfile?.id]);
  const inventoryQuery = useMemoFirebase(() => db && userProfile?.id ? collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/inventory`) : null, [db, userProfile?.id]);

  useEffect(() => {
    if (!jobsQuery) {
        setJobs([]);
        setDataLoaded(prev => ({ ...prev, jobs: true }));
        return;
    }
    const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
        setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        setDataLoaded(prev => ({ ...prev, jobs: true }));
    }, (error) => {
        showAppModal(`Error fetching jobs: ${error.message}`, 'destructive');
        setDataLoaded(prev => ({ ...prev, jobs: true }));
    });
    return () => unsubJobs();
  }, [jobsQuery, showAppModal]);

  useEffect(() => {
    if (!customersQuery) {
        setCustomers([]);
        setDataLoaded(prev => ({ ...prev, customers: true }));
        return;
    }
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
        setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
        setDataLoaded(prev => ({ ...prev, customers: true }));
    }, (error) => {
        showAppModal(`Error fetching customers: ${error.message}`, 'destructive');
        setDataLoaded(prev => ({ ...prev, customers: true }));
    });
    return () => unsubCustomers();
  }, [customersQuery, showAppModal]);

  useEffect(() => {
    if (!inventoryQuery) {
        setInventory([]);
        setDataLoaded(prev => ({ ...prev, inventory: true }));
        return;
    }
    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
        setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
        setDataLoaded(prev => ({ ...prev, inventory: true }));
    }, (error) => {
        showAppModal(`Error fetching inventory: ${error.message}`, 'destructive');
        setDataLoaded(prev => ({ ...prev, inventory: true }));
    });
    return () => unsubInventory();
  }, [inventoryQuery, showAppModal]);


  const todaysJobs = useMemo(() => {
    const todayString = format(new Date(), 'yyyy-MM-dd');
    return jobs
      .filter(job => job.scheduledDate === todayString && !job.isQuote)
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  }, [jobs]);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!geocoderRef.current) return null;
    return new Promise<google.maps.LatLngLiteral | null>((resolve) => {
        geocoderRef.current!.geocode({ address: address }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
                resolve({ lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() });
            } else {
                if (status !== 'ZERO_RESULTS') {
                  console.error(`Geocode failed: ${status}`);
                }
                resolve(null);
            }
        });
    });
  }, []);

  useEffect(() => {
    if (!isMapsApiReady || loading || !mapRef.current) return;

    const initializeMap = async () => {
        if (!mapInstanceRef.current && mapRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                center: { lat: 40.7128, lng: -74.0060 },
                zoom: 10,
                styles: [
                    { featureType: "poi", stylers: [{ "visibility": "off" }] },
                    { featureType: "transit", stylers: [{ "visibility": "off" }] },
                ],
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });
            infoWindowRef.current = new window.google.maps.InfoWindow();
            geocoderRef.current = new window.google.maps.Geocoder();
        }

        if (businessProfile?.address) {
            const businessLocation = await geocodeAddress(businessProfile.address);
            if (businessLocation && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(businessLocation);
            }
        }
    };

    const updateMapMarkers = async () => {
        if (!mapInstanceRef.current) return;

        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();
        const customerMap = new Map(customers.map(c => [c.id, c]));

        let businessLocation = null;
        if (businessProfile?.address) {
            businessLocation = await geocodeAddress(businessProfile.address);
        }

        if (businessLocation) {
             const businessMarker = new window.google.maps.Marker({
                position: businessLocation, map: mapInstanceRef.current, title: businessProfile?.name || 'Business Address',
                icon: { path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z', fillColor: '#4285F4', fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff', scale: 1.2 },
            });
            markersRef.current.push(businessMarker);
            bounds.extend(businessLocation);
        }

        const markerPromises = todaysJobs.map(async (job) => {
            const customer = customerMap.get(job.customerId);
            let location = null;
            let icon = null;

            if (job.serviceType === 'Mobile' && customer?.address) {
                location = await geocodeAddress(customer.address);
                icon = { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', fillColor: '#EA4335', fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff', scale: 1.5, };
            } else if (job.serviceType === 'In-Shop' && businessLocation) {
                location = { lat: businessLocation.lat + (Math.random() - 0.5) * 0.0005, lng: businessLocation.lng + (Math.random() - 0.5) * 0.0005, };
                icon = { path: 'M10.2,2.5l-2.4,2.4l5.8,5.8l2.4-2.4C16.9,7.4,17,6.3,16.3,5.6l-3.1-3.1C12.5,1.8,11.1,1.9,10.2,2.5z M9.9,9.9L4.1,15.8 l-2.2,2.2c-0.6,0.6-0.6,1.5,0,2.1l1.4,1.4c0.6,0.6,1.5,0.6,2.1,0l2.2-2.2l5.8-5.8L9.9,9.9z', fillColor: '#34A853', fillOpacity: 1, strokeWeight: 1, strokeColor: '#ffffff', scale: 1, anchor: new window.google.maps.Point(12, 12), };
            }

            if (location) {
                const marker = new window.google.maps.Marker({ position: location, map: mapInstanceRef.current, title: job.customerName, icon });
                marker.addListener('click', () => {
                    if (!infoWindowRef.current || !mapInstanceRef.current) return;
                    const contentString = `<div style="font-family: sans-serif; font-size: 14px; color: #333;">
                        <h4 style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">${job.customerName}</h4>
                        <p style="margin: 0 0 8px 0;">${job.year}, ${job.make}, ${job.model}</p>
                        <p style="margin: 0 0 8px 0;">Time: ${job.scheduledTime || 'Not Set'} (${job.serviceType})</p>
                        <button onclick="document.dispatchEvent(new CustomEvent('viewDashboardJobDetails', { detail: '${job.id}' }))" style="background-color: #4285F4; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">View Details</button>
                    </div>`;
                    infoWindowRef.current.setContent(contentString);
                    infoWindowRef.current.open(mapInstanceRef.current, marker);
                });
                markersRef.current.push(marker);
                return location;
            }
            return null;
        });
        
        const locations = await Promise.all(markerPromises);
        locations.forEach(location => { if (location) bounds.extend(location); });

        if (mapInstanceRef.current && !bounds.isEmpty()) {
            if(bounds.getNorthEast().equals(bounds.getSouthWest())) {
                mapInstanceRef.current.setCenter(bounds.getCenter());
                mapInstanceRef.current.setZoom(12);
            } else {
                mapInstanceRef.current.fitBounds(bounds, 80);
            }
        }
    };

    const setupMap = async () => {
      if (isMapsApiReady && mapRef.current) {
        await initializeMap();
        await updateMapMarkers();
      }
    };

    setupMap();

    const handleViewJobDetails = (event: CustomEvent) => {
        const jobToView = jobs.find(j => j.id === event.detail);
        if (jobToView) navigateTo('jobDetail', jobToView);
    };

    document.addEventListener('viewDashboardJobDetails', handleViewJobDetails as EventListener);
    return () => document.removeEventListener('viewDashboardJobDetails', handleViewJobDetails as EventListener);

  }, [todaysJobs, customers, businessProfile, loading, isMapsApiReady, geocodeAddress, navigateTo, jobs]);

  const sortedJobsByTime = useMemo(() => {
    return [...jobs].sort((a,b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
    });
  }, [jobs]);

  const totalJobs = jobs.length;
  const lowStockItems = inventory.filter(item => item.quantity < 5).length;
  const scheduledJobsCount = jobs.filter(j => j.scheduledDate && !j.isQuote && !['completed', 'billed', 'partially-paid', 'paid'].includes(j.status)).length;

  const handleCreateNewJob = (isQuote: boolean) => {
    navigateTo('jobDetail', {} as Job, null, { isQuote });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProfile?.role === 'admin' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-around items-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{totalJobs}</p>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{scheduledJobsCount}</p>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">{lowStockItems}</p>
                    <p className="text-sm text-muted-foreground">Low Stock</p>
                  </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus /> New Job
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleCreateNewJob(false)}>
                      New Work Order
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCreateNewJob(true)}>
                      New Quote
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" onClick={() => navigateTo('customerDetail', null, {} as Customer)}>
                  <UserPlus /> New Customer
                </Button>
                <Button variant="outline" onClick={() => navigateTo('glassInventory')}>
                  <Package /> Manage Inventory
                </Button>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : sortedJobsByTime.length === 0 ? (
                  <p className="text-muted-foreground">No recent jobs. Create one to get started!</p>
                ) : (
                  <ul className="space-y-4">
                    {sortedJobsByTime.slice(0, 3).map(job => (
                      <li key={job.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <button onClick={() => navigateTo('jobDetail', job)} className="text-left w-full group">
                          <span className="font-medium text-foreground group-hover:text-primary group-hover:underline">
                            <Badge variant="secondary" className="mr-2">{job.jobId}</Badge>
                             - {job.customerName}
                          </span>
                        </button>
                        <p className="text-sm text-muted-foreground mt-1">
                          Vehicle: {[job.year, job.make, job.model].filter(Boolean).join(', ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1">
            <CardHeader>
                <CardTitle>Today's Job List</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full overflow-y-auto pr-2">
                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 w-full bg-gray-200 rounded-lg animate-pulse"></div>)}
                    </div>
                ) : todaysJobs.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No jobs scheduled.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todaysJobs.map(job => (
                            <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigateTo('jobDetail', job)}>
                                <p className="font-semibold">{job.customerName}</p>
                                <p className="text-sm text-gray-500">{job.year}, {job.make}, {job.model}</p>
                                {job.jobItems?.[0]?.description && <p className="text-sm font-medium text-gray-600">Part: {job.jobItems[0].description}</p>}
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-sm font-medium">
                                        <span className={cn("px-2 py-1 rounded-full text-xs", job.serviceType === 'In-Shop' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')}>
                                            {job.serviceType}
                                        </span>
                                        <span className="ml-2">{job.scheduledTime}</span>
                                    </div>
                                    <button className="text-sm text-blue-600 hover:underline">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
        <Card className="xl:col-span-2">
            <CardHeader>
                <CardTitle>Today's Route - {format(new Date(), "MMM dd, yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="w-full h-[400px] rounded-md border bg-gray-100 flex items-center justify-center relative">
                    {isMapsApiReady ? (
                      <>
                        <div ref={mapRef} className="w-full h-full rounded-md"></div>
                        {loading && (
                            <div className="absolute inset-0 bg-gray-200/50 animate-pulse flex items-center justify-center">
                                <p className="text-gray-500">Loading Map Data...</p>
                            </div>
                        )}
                        {!loading && todaysJobs.length === 0 && (
                            <p className="absolute text-gray-500 bg-white/80 p-2 rounded-md">No jobs scheduled for today.</p>
                        )}
                      </>
                    ) : (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Map not available.</p>
                            <p className="text-xs">Please provide a valid Google Maps API key.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}

