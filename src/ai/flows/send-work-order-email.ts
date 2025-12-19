
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { htmlToText } from 'html-to-text';
import type { SendWorkOrderEmailInput, SendWorkOrderEmailOutput } from '@/lib/types';

const EmailPromptInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  companyName: z.string().describe("The name of the company sending the email."),
  documentType: z.string().describe("The type of document, e.g., 'Work Order' or 'Quote'."),
  jobId: z.string().describe("The ID of the job or quote."),
});

const SendWorkOrderEmailInputSchema = z.object({
  customerName: z.string().describe('The name of the customer.'),
  customerEmail: z.string().describe('The email address of the customer.'),
  companyName: z.string().describe("The name of the company sending the email."),
  documentType: z.string().describe("The type of document, e.g., 'Work Order' or 'Quote'."),
  jobId: z.string().describe("The ID of the job or quote."),
  pdfAttachment: z.string().optional().describe("A Base64 encoded PDF string to attach to the email."),
});

const SendWorkOrderEmailOutputSchema = z.object({
  success: z.boolean().describe('Whether the email was successfully "sent".'),
  message: z.string().describe('A summary of the action taken.'),
});

const generateEmailBodyPrompt = ai.definePrompt({
    name: 'generateWorkOrderEmailBodyPrompt',
    input: { schema: EmailPromptInputSchema },
    prompt: `You are an assistant for an auto glass company called {{{companyName}}}.\nYour task is to generate the body of an email to a customer regarding their work order or quote.\n\nThe tone should be professional and friendly.\n- Address the customer by name: {{{customerName}}}\n- State that their {{{documentType}}} is ready for review.\n- Mention the document ID: {{{jobId}}}\n- Inform them that the document is attached to the email for their records.\n- Thank them for their business.\n\nDo not include a subject line. Just generate the email body text.\nExample:\nHi {{{customerName}}},\n\nYour {{{documentType}}} from {{{companyName}}} is ready.\n\nYou can find the details for ID {{{jobId}}} attached to this email.\n\nThank you for your business!\n\nSincerely,\nThe {{{companyName}}} Team`,
});

const sendWorkOrderEmailFlow = ai.defineFlow(
  {
    name: 'sendWorkOrderEmailFlow',
    inputSchema: SendWorkOrderEmailInputSchema,
    outputSchema: SendWorkOrderEmailOutputSchema,
  },
  async (input: SendWorkOrderEmailInput) => {
    
    const { text: emailBody } = await generateEmailBodyPrompt({
        customerName: input.customerName,
        companyName: input.companyName,
        documentType: input.documentType,
        jobId: input.jobId,
    });

    if (!emailBody) {
        throw new Error("Failed to generate the email body.");
    }

    const emailSubject = `${input.documentType} #${input.jobId} from ${input.companyName}`;
    const htmlEmailBody = emailBody.replace(/\n/g, '<br>');

    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = process.env;
    const canSendEmail = AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION;
    
    const verifiedFromEmail = 'info@odinbin.com';

    if (!canSendEmail) {
        console.warn("AWS credentials are not set. Email will be logged to console instead of sent.");
        console.log("----- SENDING WORK ORDER EMAIL (LOG) -----");
        console.log(`To: ${input.customerEmail}`);
        console.log(`From: ${verifiedFromEmail}`);
        console.log(`Subject: ${emailSubject}`);
        console.log("Body (HTML):\n", htmlEmailBody);
        console.log("Attachments:", input.pdfAttachment ? "1 PDF attachment" : "None");
        console.log("------------------------------------------");
        return {
            success: true,
            message: `${input.documentType} for ${input.customerEmail} created. (Email sending is not configured, logged to console).`
        }
    }

    const sesClient = new SESv2Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });

    const boundary = `----=_Part_${Math.random().toString().substr(2)}`;
    let rawEmailData = `From: ${verifiedFromEmail}\n`;
    rawEmailData += `To: ${input.customerEmail}\n`;
    rawEmailData += `Subject: ${emailSubject}\n`;
    rawEmailData += `MIME-Version: 1.0\n`;
    rawEmailData += `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;
    
    rawEmailData += `--${boundary}\n`;
    rawEmailData += `Content-Type: multipart/alternative; boundary="--_InnerPart_${boundary}"\n\n`;

    rawEmailData += `----_InnerPart_${boundary}\n`;
    rawEmailData += `Content-Type: text/plain; charset=UTF-8\n\n`;
    rawEmailData += `${htmlToText(htmlEmailBody)}\n\n`;
    
    rawEmailData += `----_InnerPart_${boundary}\n`;
    rawEmailData += `Content-Type: text/html; charset=UTF-8\n\n`;
    rawEmailData += `${htmlEmailBody}\n\n`;
    rawEmailData += `------_InnerPart_${boundary}--\n`;

    if (input.pdfAttachment) {
      rawEmailData += `--${boundary}\n`;
      rawEmailData += `Content-Type: application/pdf\n`;
      rawEmailData += `Content-Disposition: attachment; filename="${input.documentType.replace(' ', '_')}_${input.jobId}.pdf"\n`;
      rawEmailData += `Content-Transfer-Encoding: base64\n\n`;
      rawEmailData += `${input.pdfAttachment}\n\n`;
    }

    rawEmailData += `--${boundary}--\n`;

    const sendEmailCommand = new SendEmailCommand({
      Destination: { ToAddresses: [input.customerEmail] },
      Content: {
        Raw: {
          Data: Buffer.from(rawEmailData)
        }
      },
      FromEmailAddress: verifiedFromEmail,
    });
    
    try {
        await sesClient.send(sendEmailCommand);
        console.log(`${input.documentType} email sent successfully via SES to:`, input.customerEmail);
        return {
          success: true,
          message: `${input.documentType} email sent to ${input.customerEmail}.`,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        console.error('Failed to send email via SES:', error);
        return {
            success: false,
            message: `Email service failed: ${errorMessage}`
        }
    }
  }
);

export async function sendWorkOrderEmail(input: SendWorkOrderEmailInput): Promise<SendWorkOrderEmailOutput> {
    return sendWorkOrderEmailFlow(input);
}
