
'use server';

/**
 * @fileOverview A flow for looking up auto glass parts from suppliers.
 *
 * - lookupPart - A function that queries suppliers for a given part number.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { LookupPartInput, LookupPartOutput } from '@/lib/types';

const LookupPartInputSchema = z.object({
  partNumber: z.string().describe('The NAGS or supplier part number to look up.'),
});

const SupplierInfoSchema = z.object({
    name: z.string().describe('The name of the supplier, e.g., Mygrant Glass.'),
    stock: z.number().describe('The available quantity of the part.'),
    price: z.number().describe('The price of the part from this supplier.'),
    location: z.string().describe('The location or warehouse of the supplier holding the stock.'),
});

const LookupPartOutputSchema = z.object({
    partNumber: z.string().describe('The part number that was looked up.'),
    results: z.array(SupplierInfoSchema).describe('A list of results from various suppliers.'),
});


export async function lookupPart(input: LookupPartInput): Promise<LookupPartOutput> {
  return lookupPartFlow(input);
}


const lookupPartFlow = ai.defineFlow(
  {
    name: 'lookupPartFlow',
    inputSchema: LookupPartInputSchema,
    outputSchema: LookupPartOutputSchema,
  },
  async (input: LookupPartInput) => {
    //
    // In a real implementation, this is where you would make API/EDI calls
    // to suppliers like Mygrant, PGW, etc. You would pass the input.partNumber
    // and the user's credentials for that supplier.
    //
    // For this demonstration, we will return mock data.
    //

    const mockResults = [
        {
            name: 'Mygrant Glass',
            stock: Math.floor(Math.random() * 20),
            price: parseFloat((Math.random() * (350 - 150) + 150).toFixed(2)),
            location: 'Philadelphia, PA'
        },
        {
            name: 'PGW Auto Glass',
            stock: Math.floor(Math.random() * 15),
            price: parseFloat((Math.random() * (380 - 160) + 160).toFixed(2)),
            location: 'Cranbury, NJ'
        },
        {
            name: 'Pilkington',
            stock: 0, // Simulate out of stock
            price: parseFloat((Math.random() * (400 - 180) + 180).toFixed(2)),
            location: 'Jessup, PA'
        }
    ];

    // Simulate some suppliers not having the part
    const filteredMockResults = mockResults.filter(r => r.stock > 0 || Math.random() > 0.3);

    return {
      partNumber: input.partNumber,
      results: filteredMockResults,
    };
  }
);
