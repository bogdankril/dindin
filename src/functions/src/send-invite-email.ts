
'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendInviteEmailInput } from '@/lib/types';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

enableFirebaseTelemetry();

// Explicitly use the API key from the environment variables provided to the function.
const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
});

const SendInviteEmailInputSchema = z.object({
  technicianName: z.string().describe('The name of the technician being invited.'),
  technicianEmail: z.string().describe('The email address of the technician to send the invite to.'),
  companyName: z.string().describe("The name of the company sending the invitation."),
  fromEmail: z.string().describe("The email address of the user sending the invitation."),
  appUrl: z.string().describe("The base URL of the application for the registration link."),
});

const sendInviteEmailPrompt = ai.definePrompt({
  name: 'sendInviteEmailPrompt',
  input: { schema: SendInviteEmailInputSchema },
  prompt: `You are an assistant for an auto glass company called {{{companyName}}}.\\nYour task is to generate the body of an invitation email to a new technician.\\n\\nThe email should be friendly, professional, and clear.\\nIt should welcome the technician, state that they\\\'ve been invited to use the company\\\'s management app, and provide a clear link to register.\\n\\n- Welcome the technician by name: {{{technicianName}}}\\n- Mention the company name: {{{companyName}}}\\n- Instruct them to register at the following URL using their email ({{{technicianEmail}}}): {{{appUrl}}}\\n\\nDo not include a subject line, just generate the email body text.`,
});

export const sendInviteEmail = ai.defineFlow(
  {
    name: 'sendInviteEmail',
    inputSchema: SendInviteEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string() }),
  },
  async (input) => {
    let emailBody;
    try {
        const result = await sendInviteEmailPrompt(input);
        emailBody = result.text;
        if (!emailBody) {
             throw new Error('AI model returned an empty response.');
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown AI error occurred.';
        console.error(`AI prompt failed for invite email: ${errorMessage}`, e);
        return {
            success: false,
            message: `Failed to generate email content. AI Error: ${errorMessage}`,
        };
    }
        
    const emailSubject = `You're Invited to Join ${input.companyName} on GlassPro!`;
    const htmlEmailBody = emailBody.replace(/\\n/g, '<br>');

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
    const canSendEmail = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION;
    const verifiedFromEmail = 'info@odinbin.com';

    const logEmailToConsole = (reason: string) => {
        console.warn(`SENDING INVITATION EMAIL (LOG): ${reason}`);
        console.log(`To: ${input.technicianEmail}`);
        console.log(`From: ${verifiedFromEmail} (Reply-To: ${input.fromEmail})`);
        console.log(`Subject: ${emailSubject}`);
        console.log("Body (HTML):\\n", htmlEmailBody);
        console.log("------------------------------------------");
    }

    if (!canSendEmail) {
        logEmailToConsole("AWS credentials are not set. Email will be logged to console instead of sent.");
        return {
            success: true,
            message: `Invitation for ${input.technicianEmail} created. (Email sending is not configured, logged to console).`
        }
    }

    const sesClient = new SESv2Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });
    
    const sendEmailCommand = new SendEmailCommand({
        FromEmailAddress: verifiedFromEmail,
        Destination: { ToAddresses: [input.technicianEmail] },
        ReplyToAddresses: [input.fromEmail],
        Content: {
            Simple: {
                Subject: { Data: emailSubject },
                Body: {
                    Html: { Data: htmlEmailBody },
                    Text: { Data: emailBody },
                },
            },
        },
    });
    
    try {
        await sesClient.send(sendEmailCommand);
        console.log('Invitation email sent successfully via SES to:', input.technicianEmail);
        return {
          success: true,
          message: `Invitation email sent to ${input.technicianEmail}.`,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        logEmailToConsole(`Failed to send email via AWS SES: ${errorMessage}`);
        // Return a structured error to the client
        return {
            success: false,
            message: `Could not send email, but the technician has been saved. (Reason: ${errorMessage})`
        }
    }
  }
);
