
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import type { SendWelcomeEmailInput, SendWelcomeEmailOutput } from '@/lib/types';

const SendWelcomeEmailInputSchema = z.object({
  userName: z.string().describe('The name of the new user.'),
  userEmail: z.string().describe('The email address of the new user.'),
  temporaryPassword: z.string().describe("The user's temporary password."),
  companyName: z.string().describe("The name of the company."),
  appUrl: z.string().describe("The base URL of the application for the login link."),
});

const SendWelcomeEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was successfully "sent".'),
  message: z.string().describe('A summary of the action taken.'),
});

const prompt = ai.definePrompt({
  name: 'sendWelcomeEmailPrompt',
  input: { schema: SendWelcomeEmailInputSchema },
  prompt: `You are an assistant for an auto glass company called {{{companyName}}}.
Your task is to generate the body of a welcome email to a new user who has just been added to the system.

The email should be friendly, professional, and clear.
It should welcome the new user by name and provide them with their login credentials and a link to the app.

- Welcome the user by name: {{{userName}}}
- State that an account has been created for them for {{{companyName}}}.
- Provide their login credentials:
  - Email: {{{userEmail}}}
  - Temporary Password: {{{temporaryPassword}}}
- Instruct them to log in at: {{{appUrl}}}
- Recommend that they change their password upon first login (though this is not enforced).

Do not include a subject line, just generate the email body text.`,
});

const sendWelcomeEmailFlow = ai.defineFlow(
  {
    name: 'sendWelcomeEmailFlow',
    inputSchema: SendWelcomeEmailInputSchema,
    outputSchema: SendWelcomeEmailOutputSchema,
  },
  async (input: SendWelcomeEmailInput) => {
    const { text: emailBody } = await prompt(input);
    
    if (!emailBody) {
        throw new Error('Failed to generate email body.');
    }

    const emailSubject = `Welcome to the ${input.companyName} Team on GlassPro!`;
    const htmlEmailBody = emailBody.replace(/\n/g, '<br>');

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
    const canSendEmail = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION;
    
    const verifiedFromEmail = 'info@odinbin.com';

    if (!canSendEmail) {
        console.warn("AWS credentials are not set. Email will be logged to console instead of sent.");
        console.log("----- SENDING WELCOME EMAIL (LOG) -----");
        console.log(`To: ${input.userEmail}`);
        console.log(`From: ${verifiedFromEmail}`);
        console.log(`Subject: ${emailSubject}`);
        console.log("Body (HTML):\n", htmlEmailBody);
        console.log("---------------------------------------");
        return {
            success: true,
            message: `User account for ${input.userEmail} created. (Email sending is not configured on the server, so welcome email was not sent).`
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
        Destination: { ToAddresses: [input.userEmail] },
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
        console.log('Welcome email sent successfully via SES to:', input.userEmail);
        return {
          success: true,
          message: `Welcome email sent to ${input.userEmail}.`,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error(`Failed to send email via AWS SES: ${errorMessage}`);
        return {
            success: false,
            message: errorMessage
        }
    }
  }
);

export async function sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<SendWelcomeEmailOutput> {
    return sendWelcomeEmailFlow(input);
}
