
'use client';

import dynamic from 'next/dynamic';
import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';

const FirebaseClientProvider = dynamic(
  () => import('./client-provider').then(mod => mod.FirebaseClientProvider),
  { ssr: false }
);

export function DynamicProvider({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      {isClient ? (
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
      ) : (
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      )}
    </>
  );
}
