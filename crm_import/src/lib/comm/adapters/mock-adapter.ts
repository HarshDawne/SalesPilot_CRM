import { DialerProvider, CallJob } from './types';
import { v4 as uuidv4 } from 'uuid';

export class MockAdapter implements DialerProvider {
    async dial(job: CallJob): Promise<{ providerCallId: string }> {
        console.log(`[MockAdapter] Dialing ${job.phoneNumber} for job ${job.id}`);
        return { providerCallId: `mock_call_${uuidv4()}` };
    }

    async hangup(providerCallId: string): Promise<void> {
        console.log(`[MockAdapter] Hanging up call ${providerCallId}`);
    }

    async fetchRecording(providerCallId: string): Promise<string | null> {
        return `https://mock-provider.com/recordings/${providerCallId}.mp3`;
    }

    async fetchTranscript(providerCallId: string): Promise<string | null> {
        return "This is a mock transcript of the conversation.";
    }

    verifyWebhookSignature(headers: Headers, body: any): boolean {
        // Always return true for mock
        return true;
    }

    async sendWhatsApp(templateId: string, to: string, variables: Record<string, string>, mediaUrl?: string): Promise<{ providerMsgId: string }> {
        console.log(`[MockAdapter] Sending WhatsApp to ${to} using template ${templateId}`, variables);
        return { providerMsgId: `mock_msg_${uuidv4()}` };
    }
}
