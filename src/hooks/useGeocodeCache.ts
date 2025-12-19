
"use client";

import { useRef, useEffect, useCallback } from "react";

const CACHE_KEY = "geocodeCache";
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days
const CACHE_MAX_ENTRIES = 1000;

const DEBUG_CACHE = process.env.NODE_ENV === "development";

function logCache(message: string) {
  if (DEBUG_CACHE) console.log(message);
}

interface CachedLocation {
  location: google.maps.LatLngLiteral;
  timestamp: number;
}

export function useGeocodeCache(isMapsApiReady: boolean) {
  const geocodeCache = useRef<Map<string, CachedLocation>>(new Map());

  // Load cache from localStorage
  useEffect(() => {
    const storedCache = localStorage.getItem(CACHE_KEY);
    if (storedCache) {
      try {
        const parsed: Record<string, CachedLocation> = JSON.parse(storedCache);

        const freshEntries = Object.entries(parsed).filter(([_, entry]) => {
          return Date.now() - entry.timestamp < CACHE_TTL;
        });

        geocodeCache.current = new Map(freshEntries);

        logCache(
          `📦 Loaded ${freshEntries.length} valid geocode entries from localStorage`
        );
      } catch (err) {
        console.error("Failed to parse geocodeCache from localStorage", err);
      }
    }

    // Expose dev-only clear method
    if (DEBUG_CACHE) {
      (window as any).clearGeocodeCache = () => {
        geocodeCache.current.clear();
        localStorage.removeItem(CACHE_KEY);
        console.log("🧹 Geocode cache cleared manually");
      };
    }
  }, []);

  // Persist cache with pruning
  const persistCache = useCallback(() => {
    let entries = Array.from(geocodeCache.current.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);

    if (entries.length > CACHE_MAX_ENTRIES) {
      logCache(`🗑️ Pruning ${entries.length - CACHE_MAX_ENTRIES} old entries`);
      entries = entries.slice(0, CACHE_MAX_ENTRIES);
    }

    const cacheObj: Record<string, CachedLocation> = {};
    entries.forEach(([key, val]) => (cacheObj[key] = val));

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
  }, []);

  // Geocode with caching
  const geocodeAddress = useCallback(
    async (address: string): Promise<google.maps.LatLngLiteral | null> => {
      const cached = geocodeCache.current.get(address);

      if (cached) {
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          logCache(`✅ Cache hit for: "${address}"`);
          return cached.location;
        } else {
          logCache(`⚠️ Expired cache for: "${address}"`);
        }
      } else {
        logCache(`❌ Cache miss for: "${address}"`);
      }

      if (!isMapsApiReady) return null;

      const geocoder = new window.google.maps.Geocoder();
      try {
        const { results } = await geocoder.geocode({ address });
        if (results?.[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          };

          geocodeCache.current.set(address, {
            location,
            timestamp: Date.now(),
          });
          persistCache();
          logCache(`📌 Cached new result for: "${address}"`);
          return location;
        }
      } catch (err) {
        console.error("Geocode error", err);
      }

      return null;
    },
    [isMapsApiReady, persistCache]
  );

  return { geocodeAddress };
}
