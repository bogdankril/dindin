
"use client";

import { useState, useEffect } from 'react';
import { decodeVin } from '@/ai/flows/decode-vin';
import type { DecodeVinOutput } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VinDecoderProps {
  initialVin?: string;
  onDecodeSuccess: (data: Partial<DecodeVinOutput> & { vin: string }) => void;
}

export default function VinDecoder({ initialVin = '', onDecodeSuccess }: VinDecoderProps) {
  const [vin, setVin] = useState(initialVin);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // This effect will run whenever the `initialVin` prop changes.
  useEffect(() => {
    setVin(initialVin);
  }, [initialVin]);


  const handleDecode = async () => {
    if (vin.length !== 17) {
      setError('Please enter a full 17-character VIN.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      const decodedData = await decodeVin({ vin });
      onDecodeSuccess({ ...decodedData, vin });
      if (decodedData.make && decodedData.make !== 'Not Available') {
         toast({ title: "VIN Decoded", description: `Vehicle details for ${decodedData.year}, ${decodedData.make}, ${decodedData.model} have been pre-filled.` });
      } else {
         toast({ title: "VIN Decode Complete", description: "Some details were not available. Please fill them in manually." });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to decode VIN. Please check the VIN and try again. Error: ${errorMessage}`);
      onDecodeSuccess({ vin }); // Pass back just the vin on failure
      toast({
        variant: "destructive",
        title: "VIN Decode Failed",
        description: "Could not decode VIN. Please check it and try again, or enter details manually.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          onClick={handleDecode}
          disabled={isLoading || vin.length !== 17}
          className="w-full"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Decode VIN with AI'}
        </Button>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

    </div>
  );
}
