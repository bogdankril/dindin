"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { lookupPart } from '@/ai/flows/lookup-part';
import type { LookupPartOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';

export default function PartsLookup() {
  const [partNumber, setPartNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LookupPartOutput | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!partNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a part number to search.',
      });
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const response = await lookupPart({ partNumber: partNumber.trim() });
      setResults(response);
      if (response.results.length === 0) {
        toast({
          title: 'No Results',
          description: `No suppliers found with stock for part number ${partNumber}.`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parts Lookup</CardTitle>
          <CardDescription>
            Search for auto glass parts by part number across multiple suppliers in real-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="text"
              placeholder="Enter part number (e.g., DW01519GTY)"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="button" onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results for: {results.partNumber}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No stock found for this part.
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{result.name}</TableCell>
                        <TableCell>{result.stock}</TableCell>
                        <TableCell>{result.location}</TableCell>
                        <TableCell className="text-right">${result.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
