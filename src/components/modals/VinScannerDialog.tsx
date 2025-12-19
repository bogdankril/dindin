
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Camera, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';

interface VinScannerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVinScanned: (vin: string) => void;
}

export default function VinScannerDialog({
  isOpen,
  onOpenChange,
  onVinScanned,
}: VinScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameId = useRef<number>();
  const [isApiSupported, setIsApiSupported] = useState<boolean | null>(null);
  const { toast } = useToast();

  const stopScan = useCallback(() => {
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = undefined;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopScan();
      return;
    }

    if (isApiSupported === null) {
      const supported = 'BarcodeDetector' in window;
      setIsApiSupported(supported);
      if (!supported) {
        toast({
          variant: 'destructive',
          title: 'Scanner Not Supported',
          description: 'Your browser does not support the barcode scanning API.',
        });
        return;
      }
    }
    
    if (isApiSupported === false) return;

    let barcodeDetector: any;
    try {
        barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['code_39', 'code_128', 'qr_code', 'ean_13', 'itf'],
        });
    } catch (e) {
        console.error("Failed to create BarcodeDetector:", e);
        setIsApiSupported(false);
        toast({
            variant: 'destructive',
            title: 'Scanner Initialization Failed',
            description: 'Could not start the barcode scanner.',
        });
        return;
    }
    

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        const videoElement = videoRef.current;
        if (videoElement) {
            videoElement.srcObject = stream;
            
            videoElement.onloadedmetadata = async () => {
              try {
                await videoElement.play();
                const detectBarcode = async () => {
                    if (videoElement.readyState >= 2) {
                        try {
                            const barcodes = await barcodeDetector.detect(videoElement);
                            if (barcodes.length > 0) {
                                const detectedVin = barcodes[0].rawValue;
                                if (detectedVin.length === 17) {
                                    toast({ title: 'VIN Scanned!', description: 'Your 17-character VIN has been captured.' });
                                    onVinScanned(detectedVin);
                                    onOpenChange(false);
                                    return; // Stop the loop
                                } else {
                                    toast({ 
                                        variant: 'destructive',
                                        title: 'Invalid Barcode', 
                                        description: `Scanned a barcode with ${detectedVin.length} characters. Please scan a 17-character VIN.`,
                                        duration: 2000
                                    });
                                }
                            }
                        } catch (e) {
                            console.error('Barcode detection error:', e);
                        }
                    }
                    if (isOpen) {
                       animationFrameId.current = requestAnimationFrame(detectBarcode);
                    }
                };
                detectBarcode();
              } catch (playError) {
                  console.error("Video play failed:", playError);
              }
            };
        }

      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
        onOpenChange(false);
      }
    };

    startCamera();

    return () => {
      stopScan();
    };

  }, [isOpen, onOpenChange, onVinScanned, toast, isApiSupported, stopScan]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Scan VIN Barcode</DialogTitle>
          <DialogDescription>Point your camera at the VIN barcode.</DialogDescription>
        </DialogHeader>

        <div className="relative w-full aspect-[9/16] bg-black overflow-hidden">
          <video ref={videoRef} className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto object-cover -translate-x-1/2 -translate-y-1/2 rotate-90 -scale-x-100" muted autoPlay playsInline />
          {isOpen && isApiSupported === null && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Camera className="h-10 w-10 mb-2"/>
                <p>Requesting camera access...</p>
            </div>
          )}
        </div>
        
        <div className="p-4 pt-2">
             {isApiSupported === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Scanner Not Supported</AlertTitle>
                  <AlertDescription>
                    Unfortunately, your browser does not support the built-in barcode scanning feature.
                  </AlertDescription>
                </Alert>
            )}
        </div>
        <DialogFooter className="p-4 pt-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
