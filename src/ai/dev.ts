
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/decode-vin.ts';
import '@/ai/flows/send-welcome-email.ts';
import '@/ai/flows/send-work-order-email.ts';
import '@/ai/flows/send-invite-email.ts';
