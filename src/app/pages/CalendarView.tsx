
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '@/hooks/useAppContext';
import { doc, onSnapshot, query, where, collection, addDoc } from 'firebase/firestore';
import type { Job, Customer, BusinessProfile, Technician } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getPreviousWorkDay, getNextWorkDay } from '@/lib/dates';
import { format } from 'date-fns';
import { useMemoFirebase } from '@/firebase';

const APP_ID = 'glass-pro-3a83';

export default function CalendarView() {
    const { 
        db,
        navigateTo, 
        setShowJobSelectionModal,
        setJobSelectionModalProps,
        setShowDateTimePickerModal,
        setDateTimePickerModalProps,
        setShowTechnicianAssignModal,
        setTechnicianAssignModalProps,
        updateJobSchedule,
        userProfile,
        showAppModal: showToast,
        isMapsApiReady
    } = useAppContext();
    
    const [currentView, setCurrentView] = useState('threeDay');
    const [displayDate, setDisplayDate] = useState<Date | null>(null);

    const [allScheduledJobs, setAllScheduledJobs] = useState<Job[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);

    const [jobsLoading, setJobsLoading] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [customersLoading, setCustomersLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);

    const isLoading = useMemo(() => !displayDate || jobsLoading || settingsLoading || customersLoading || profileLoading, [displayDate, jobsLoading, settingsLoading, customersLoading, profileLoading]);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    
    useEffect(() => {
        setDisplayDate(new Date());
    }, []);

    const geocodeAddress = useCallback(async (address: string) => {
        if (!geocoderRef.current) {
            console.error('Geocoder is not initialized.');
            return null;
        }

        return new Promise<google.maps.LatLngLiteral | null>((resolve) => {
            geocoderRef.current!.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                    resolve({
                        lat: results[0].geometry.location.lat(),
                        lng: results[0].geometry.location.lng(),
                    });
                } else {
                    if (status !== 'ZERO_RESULTS') {
                        console.error('Geocode was not successful for the following reason: ' + status);
                    }
                    resolve(null);
                }
            });
        });
    }, []);

    const settingsRef = useMemoFirebase(() => db && userProfile?.id ? doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/scheduleView`) : null, [db, userProfile?.id]);
    const jobsQuery = useMemoFirebase(() => db && userProfile?.id ? query(collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/jobs`), where('scheduledDate', '!=', '')) : null, [db, userProfile?.id]);
    const customersRef = useMemoFirebase(() => db && userProfile?.id ? collection(db, `artifacts/${APP_ID}/users/${userProfile.id}/customers`) : null, [db, userProfile?.id]);
    const profileRef = useMemoFirebase(() => db && userProfile?.id ? doc(db, `artifacts/${APP_ID}/users/${userProfile.id}/settings/businessProfile`) : null, [db, userProfile?.id]);
    
    useEffect(() => {
        if (!settingsRef) {
            setSettingsLoading(false);
            return;
        }
        const unsubSettings = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.defaultView) setCurrentView(data.defaultView);
            }
            setSettingsLoading(false);
        });
        return () => unsubSettings();
    }, [settingsRef]);

    useEffect(() => {
        if (!jobsQuery) {
            setAllScheduledJobs([]);
            setJobsLoading(false);
            return;
        }
        const unsubJobs = onSnapshot(jobsQuery, (snapshot) => {
            setAllScheduledJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
            setJobsLoading(false);
        });
        return () => unsubJobs();
    }, [jobsQuery]);

    useEffect(() => {
        if (!customersRef) {
            setCustomers([]);
            setCustomersLoading(false);
            return;
        }
        const unsubCustomers = onSnapshot(customersRef, (snapshot) => {
            setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
            setCustomersLoading(false);
        });
        return () => unsubCustomers();
    }, [customersRef]);

    useEffect(() => {
        if (!profileRef) {
            setBusinessProfile(null);
            setProfileLoading(false);
            return;
        }
        const unsubProfile = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) {
                setBusinessProfile({ id: doc.id, ...doc.data() } as BusinessProfile);
            }
            setProfileLoading(false);
        });
        return () => unsubProfile();
    }, [profileRef]);

    const jobsForSelectedDate = useMemo(() => {
        if (!displayDate) return [];
        const dateString = format(displayDate, 'yyyy-MM-dd');
        return allScheduledJobs
            .filter(job => job.scheduledDate === dateString)
            .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
    }, [allScheduledJobs, displayDate]);
    
    // Map Update Effect
    useEffect(() => {
        if (!isMapsApiReady || isLoading || !mapRef.current) return;

        const initializeMap = async () => {
            if (!mapInstanceRef.current && mapRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
                    center: { lat: 40.7128, lng: -74.0060 }, // Default center
                    zoom: 8,
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

            // Clear existing markers
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
                    position: businessLocation,
                    map: mapInstanceRef.current,
                    title: businessProfile?.name || 'Business Address',
                    icon: { // Home base icon
                        path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
                        fillColor: '#4285F4',
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: '#ffffff',
                        scale: 1.2
                    },
                });
                markersRef.current.push(businessMarker);
                bounds.extend(businessLocation);
            }

            const markerPromises = jobsForSelectedDate.map(async (job) => {
                const customer = customerMap.get(job.customerId);
                let location = null;
                let icon = null;

                if (job.serviceType === 'Mobile' && customer?.address) {
                    location = await geocodeAddress(customer.address);
                    icon = {
                        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', // Pin icon
                        fillColor: '#EA4335',
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: '#ffffff',
                        scale: 1.5,
                    };
                } else if (job.serviceType === 'In-Shop' && businessLocation) {
                    location = { // Slightly offset in-shop jobs to avoid perfect overlap
                        lat: businessLocation.lat + (Math.random() - 0.5) * 0.0005,
                        lng: businessLocation.lng + (Math.random() - 0.5) * 0.0005,
                    };
                    icon = { // Wrench icon
                        path: 'M10.2,2.5l-2.4,2.4l5.8,5.8l2.4-2.4C16.9,7.4,17,6.3,16.3,5.6l-3.1-3.1C12.5,1.8,11.1,1.9,10.2,2.5z M9.9,9.9L4.1,15.8 l-2.2,2.2c-0.6,0.6-0.6,1.5,0,2.1l1.4,1.4c0.6,0.6,1.5,0.6,2.1,0l2.2-2.2l5.8-5.8L9.9,9.9z',
                        fillColor: '#34A853',
                        fillOpacity: 1,
                        strokeWeight: 1,
                        strokeColor: '#ffffff',
                        scale: 1,
                        anchor: new window.google.maps.Point(12, 12),
                    };
                }

                if (location) {
                    const marker = new window.google.maps.Marker({ position: location, map: mapInstanceRef.current, title: job.customerName, icon });
                    marker.addListener('click', () => {
                        if (!infoWindowRef.current || !mapInstanceRef.current) return;
                        const contentString = `<div style="font-family: sans-serif; font-size: 14px; color: #333;">
                            <h4 style="margin: 0 0 5px 0; font-size: 16px; font-weight: 600;">${job.customerName}</h4>
                            <p style="margin: 0 0 8px 0;">${job.year}, ${job.make}, ${job.model}</p>
                            <p style="margin: 0 0 8px 0;">Time: ${job.scheduledTime || 'Not Set'} (${job.serviceType})</p>
                            <button onclick="document.dispatchEvent(new CustomEvent('viewJobDetails', { detail: '${job.id}' }))" style="background-color: #4285F4; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">View Details</button>
                        </div>`;

                        infoWindowRef.current.setContent(contentString);
                        infoWindowRef.current.open(mapInstanceRef.current, marker);
                    });
                    markersRef.current.push(marker);
                    return location;
                }
                return null;
            });
            
            // Wait for all geocoding to finish
            const locations = await Promise.all(markerPromises);

            locations.forEach(location => {
                if (location) {
                    bounds.extend(location);
                }
            });

            if (mapInstanceRef.current && !bounds.isEmpty()) {
                // If there's only one pin (or only the business location), don't zoom in too far
                if(bounds.getNorthEast().equals(bounds.getSouthWest())){
                     mapInstanceRef.current.setCenter(bounds.getCenter());
                     mapInstanceRef.current.setZoom(12);
                } else {
                    mapInstanceRef.current.fitBounds(bounds, 80); // Increased padding
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
            const jobId = event.detail;
            const jobToView = allScheduledJobs.find(j => j.id === jobId);
            if (jobToView) {
                navigateTo('jobDetail', jobToView);
            }
        };

        document.addEventListener('viewJobDetails', handleViewJobDetails as EventListener);
        
        return () => {
            document.removeEventListener('viewJobDetails', handleViewJobDetails as EventListener);
        };

    }, [jobsForSelectedDate, customers, businessProfile, isLoading, isMapsApiReady, geocodeAddress, navigateTo, allScheduledJobs]);


    const getJobsForDate = useCallback((date: Date) => {
        const dateString = format(date, 'yyyy-MM-dd');
        return allScheduledJobs.filter(job => job.scheduledDate === dateString);
    }, [allScheduledJobs]);

    const handleAssignTechnician = async (jobId: string, tech: Technician) => {
      showToast("This feature is disabled as Firebase is not connected.", "destructive");
    };

    const handleDayClick = (dayDate: Date) => {
        const jobsForDay = getJobsForDate(dayDate);
        if (jobsForDay.length > 0) {
            setJobSelectionModalProps({
                jobs: jobsForDay,
                selectedDate: dayDate,
                onSelectJob: (job) => navigateTo('jobDetail', job),
                onRescheduleJob: (job) => {
                    setShowDateTimePickerModal(true);
                    setDateTimePickerModalProps({
                        onSave: (date, time, serviceType, jobToReschedule) => {
                            if(jobToReschedule?.id) {
                                updateJobSchedule(jobToReschedule.id, date, time, serviceType as 'In-Shop' | 'Mobile');
                            }
                        },
                        jobToReschedule: job,
                        initialDate: job.scheduledDate,
                        initialTime: job.scheduledTime,
                        initialServiceType: job.serviceType
                    });
                },
                onAssignTechnician: (job) => {
                  setShowTechnicianAssignModal(true);
                  setTechnicianAssignModalProps({
                    job: job,
                    onAssign: handleAssignTechnician,
                  });
                },
            });
            setShowJobSelectionModal(true);
        }
        setDisplayDate(dayDate);
    };

    const handleNav = (direction: 'prev' | 'next') => {
        if (!displayDate) return;
        const newDate = new Date(displayDate);
        const d = direction === 'prev' ? -1 : 1;
        if (currentView === 'threeDay') {
            newDate.setDate(newDate.getDate() + d);
            setDisplayDate(newDate);
        } else if (currentView === 'weekly') {
            newDate.setDate(newDate.getDate() + (7 * d));
            setDisplayDate(newDate);
        } else if (currentView === 'monthly') {
            newDate.setMonth(newDate.getMonth() + d);
            setDisplayDate(newDate);
        }
    };

    const renderCalendarContent = () => {
        if (isLoading || !displayDate) return <div className="flex justify-center items-center h-64"><p className="text-center text-gray-500">Loading schedule...</p></div>;

        if (currentView === 'threeDay') {
            const threeDays = [getPreviousWorkDay(displayDate), displayDate, getNextWorkDay(displayDate)];

            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {threeDays.map((day) => {
                        const jobsForDay = getJobsForDate(day);
                        const inShopJobs = jobsForDay.filter(j => j.serviceType === 'In-Shop').length;
                        const mobileJobs = jobsForDay.filter(j => j.serviceType === 'Mobile').length;
                        return (
                            <div key={day.toISOString()} onClick={() => setDisplayDate(day)} className={cn("p-4 md:p-6 rounded-xl border bg-white shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow", format(day, 'yyyy-MM-dd') === format(displayDate, 'yyyy-MM-dd') && "border-blue-600 ring-2 ring-blue-600")}>
                                <div className="text-lg md:text-xl font-bold text-gray-800">{format(day, 'cccc, MMM d')}</div>
                                <div className="space-y-2 mt-4">
                                    {jobsForDay.length === 0 ? <p className="text-gray-500">No jobs</p> : <>
                                        {inShopJobs > 0 && <p className="flex items-center text-sm text-green-700 font-medium">🔧 {inShopJobs} In-Shop</p>}
                                        {mobileJobs > 0 && <p className="flex items-center text-sm text-blue-700 font-medium">🚗 {mobileJobs} Mobile</p>}
                                    </>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
        const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
        const startOfWeek = new Date(startOfMonth);
        startOfWeek.setDate(startOfWeek.getDate() - startOfMonth.getDay());

        let days = [];
        if (currentView === 'monthly') {
            let currentDate = new Date(startOfWeek);
            while (days.length < 42) {
                 days.push(new Date(currentDate));
                 currentDate.setDate(currentDate.getDate() + 1);
            }
        } else { // weekly
            const weekStart = new Date(displayDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            for (let i = 0; i < 7; i++) {
                days.push(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i));
            }
        }

        return (
            <div className={cn("grid gap-1", currentView === 'monthly' ? 'grid-cols-7' : 'grid-cols-1 md:grid-cols-7')}>
                <div className="grid grid-cols-7 col-span-1 md:col-span-7">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`} className="text-center font-semibold text-gray-500 text-xs py-2">{day}</div>)}
                </div>
                {days.map(day => {
                    const jobsForDay = getJobsForDate(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.getMonth() === displayDate.getMonth();
                    const isSelected = day.toDateString() === displayDate.toDateString();
                    return (
                        <div key={day.toISOString()} onClick={() => handleDayClick(day)} className={cn("p-1 md:p-2 rounded-lg border h-24 md:h-28 flex flex-col cursor-pointer hover:bg-gray-100 transition-colors",
                            isToday && "bg-blue-100/50",
                            isSelected && "border-blue-600 ring-2 ring-blue-600",
                            !isCurrentMonth && currentView === 'monthly' && "opacity-50"
                        )}>
                            <span className={cn("font-medium text-xs md:text-sm", isToday && "text-blue-600")}>{day.getDate()}</span>
                            <div className="flex-grow space-y-1 text-xs overflow-y-auto mt-1">
                                {jobsForDay.map(job => (
                                    <div key={job.id} className="p-1 rounded bg-blue-100 text-blue-800 truncate text-[10px] md:text-xs">
                                        {job.customerName}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const viewTitle = useMemo(() => {
        if (!displayDate) return "Loading...";
        if (currentView === 'monthly') return format(displayDate, 'MMMM yyyy');
        if (currentView === 'weekly') {
            const start = new Date(displayDate);
            start.setDate(start.getDate() - start.getDay());
            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            return `${format(start, 'MMM dd')} - ${format(end, 'MMM dd, yyyy')}`;
        }
        return format(displayDate, 'cccc, MMMM d, yyyy');
    }, [currentView, displayDate]);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-xl shadow p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Job Schedule</h2>
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                onClick={() => setCurrentView('threeDay')}
                                className={cn("px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium", currentView === 'threeDay' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                            >3-Day</button>
                            <button
                                onClick={() => setCurrentView('weekly')}
                                className={cn("px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium", currentView === 'weekly' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                            >Weekly</button>
                            <button
                                onClick={() => setCurrentView('monthly')}
                                className={cn("px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-lg font-medium", currentView === 'monthly' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-800 hover:bg-gray-200')}
                            >Monthly</button>
                        </div>
                    </div>
                    <div className="flex justify-between items-center my-4 md:my-6">
                        <button onClick={() => handleNav('prev')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <h3 className="text-lg md:text-xl font-semibold text-center">{viewTitle}</h3>
                        <button onClick={() => handleNav('next')} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                    {renderCalendarContent()}
                </div>
            </div>

            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Map for {displayDate ? format(displayDate, "MMM dd, yyyy") : "..."}</h2>
                    <div className="w-full h-[300px] rounded-md border bg-gray-100 flex items-center justify-center relative">
                        {isMapsApiReady ? (
                          <>
                            <div ref={mapRef} className="w-full h-full rounded-md"></div>
                            {isLoading && (
                                <div className="absolute inset-0 bg-gray-200/50 animate-pulse flex items-center justify-center">
                                    <p className="text-gray-500">Loading Map Data...</p>
                                </div>
                            )}
                            {!isLoading && jobsForSelectedDate.length === 0 && (
                                <p className="absolute text-gray-500 bg-white/80 p-2 rounded-md">No scheduled jobs for this date.</p>
                            )}
                          </>
                        ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <p>Map not available.</p>
                                <p className="text-xs">Please provide a valid Google Maps API key.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Job List for {displayDate ? format(displayDate, "MMM dd, yyyy") : "..."}</h2>
                    <div className="h-[300px] w-full overflow-y-auto pr-2">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => <div key={i} className="h-16 w-full bg-gray-200 rounded-lg animate-pulse"></div>)}
                            </div>
                        ) : jobsForSelectedDate.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">No jobs scheduled.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jobsForSelectedDate.map(job => (
                                    <div key={job.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => navigateTo('jobDetail', job)}>
                                        <p className="font-semibold">{job.customerName}</p>
                                        <p className="text-sm text-gray-500">{job.make} {job.model} ({job.year})</p>
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
                </div>
            </div>
        </div>
    );
}
