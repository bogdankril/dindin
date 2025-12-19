
"use client";

import React, { Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

interface LazyLoadProps {
  path: string;
  [key: string]: any; 
}

const LoadingComponent = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div className="w-full max-w-lg rounded-lg bg-background p-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-20 w-full" />
        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  </div>
);


export default function LazyLoad({ path, ...props }: LazyLoadProps) {
  const Component = useMemo(() => {
    return dynamic(() => import(`@/components/${path}`), {
      ssr: false,
    });
  }, [path]);

  if (!props.isOpen) {
    return null;
  }

  return (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  );
}
