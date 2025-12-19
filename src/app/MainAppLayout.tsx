
'use client';

import AppSidebar from '@/components/layout/AppSidebar';
import Header from '@/components/layout/Header';
import { useState } from 'react';

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
