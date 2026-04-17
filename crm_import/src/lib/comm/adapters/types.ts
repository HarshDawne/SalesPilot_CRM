export interface CallJob {
    id: string;
    leadId: string;
    phoneNumber: string;
    scriptId: string;
    voiceId?: string;
    metadata?: Record<string, any>;
}

export interface DialerProvider {
    dial(job: CallJob): Promise<{ providerCallId: string }>;
    hangup(providerCallId: string): Promise<void>;
    fetchRecording(providerCallId: string): Promise<string | null>;
    fetchTranscript(providerCallId: string): Promise<string | null>;
    verifyWebhookSignature(headers: Headers, body: any): boolean;
    sendWhatsApp(templateId: string, to: string, variables: Record<string, string>, mediaUrl?: string): Promise<{ providerMsgId: string }>;
}
