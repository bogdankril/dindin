
"use client";

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Share, X } from 'lucide-react';

export default function A2hsBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Determine if the device is an iPhone/iPad/iPod
    const isIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Check if the app is running in standalone mode (already installed)
    const isInStandaloneMode = () =>
      ('standalone' in window.navigator) && ((window.navigator as any).standalone);

    // Show the banner only if it's an iOS device and not in standalone mode
    if (isIOS() && !isInStandaloneMode()) {
        const hasBeenDismissed = localStorage.getItem('a2hs-banner-dismissed');
        if (!hasBeenDismissed) {
            setIsVisible(true);
        }
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('a2hs-banner-dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md z-50">
      <div className="bg-background border shadow-xl rounded-lg p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <Share className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-grow">
          <p className="text-sm font-semibold">Install GlassPro on your device!</p>
          <p className="text-xs text-muted-foreground">
            Tap the Share button and then &apos;Add to Home Screen&apos;.
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
