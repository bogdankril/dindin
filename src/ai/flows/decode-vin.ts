
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { DecodeVinInput, DecodeVinOutput } from '@/lib/types';

const DecodeVinInputSchema = z.object({
  vin: z.string().describe('The Vehicle Identification Number to decode.'),
});

const DecodeVinOutputSchema = z.object({
  make: z.string().describe('The make of the vehicle.'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.string().describe('The year of the vehicle.'),
  trim: z.string().describe('The trim of the vehicle.'),
  engine: z.string().describe('The engine of the vehicle.'),
  driveType: z.string().describe('The drive type of the vehicle.'),
  bodyClass: z.string().describe('The body class of the vehicle.'),
  airBags: z.string().describe('The front air bag locations of the vehicle.'),
  fuel: z.string().describe('The fuel type of the vehicle.'),
});

const prompt = ai.definePrompt({
  name: 'decodeVinPrompt',
  input: {schema: DecodeVinInputSchema},
  output: {schema: DecodeVinOutputSchema},
  prompt: `You are an expert automotive technician with extensive knowledge of vehicle identification numbers (VINs).\nGiven a VIN, you can accurately identify the make, model, year, and other key details of the vehicle.\n\nPlease decode the following VIN and extract the following information:\n\nVIN: {{{vin}}}\n\nEnsure that all fields are accurately populated based on the VIN provided. If a field cannot be determined, return "Not Available".\n\nReturn a JSON object with the following keys:\n- make\n- model\n- year\n- trim\n- engine\n- driveType\n- bodyClass\n- airBags\n- fuel`,
});

const decodeVinFlow = ai.defineFlow(
  {
    name: 'decodeVinFlow',
    inputSchema: DecodeVinInputSchema,
    outputSchema: DecodeVinOutputSchema,
  },
  async (input: DecodeVinInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function decodeVin(input: DecodeVinInput): Promise<DecodeVinOutput> {
    return decodeVinFlow(input);
}
