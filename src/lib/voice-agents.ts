import { VOICE_CONFIG } from "./voice-config";

export type IntentLevel = 'low' | 'medium' | 'high';

export interface AgentConfig {
    id: string;
    name: string;
    maxDuration: number | null; // seconds
}

export const AGENT_CONFIGS = {
    AGENT_1_QUALIFICATION: {
        id: VOICE_CONFIG.AGENT_QUALIFIER_ID || VOICE_CONFIG.AGENT_ID,
        name: "Qualification Agent",
        maxDuration: 60, // seconds
        autoHangupRules: {
            budgetMismatchThreshold: 0.20, // 20%
            maxTimelineMonths: 12,
            minIntentLevel: "medium" as IntentLevel,
        },
    },
    AGENT_2_CLOSING: {
        id: VOICE_CONFIG.AGENT_CLOSER_ID || VOICE_CONFIG.AGENT_ID,
        name: "Closing Agent",
        maxDuration: null, // unlimited
    },
};
