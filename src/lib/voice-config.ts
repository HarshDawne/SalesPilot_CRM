export const VOICE_CONFIG = {
    API_KEY: process.env.BOLNA_API_KEY || "",
    AGENT_ID: process.env.BOLNA_AGENT_ID || "",
    AGENT_QUALIFIER_ID: process.env.BOLNA_AGENT_QUALIFIER_ID || "",
    AGENT_CLOSER_ID: process.env.BOLNA_AGENT_CLOSER_ID || "",
    API_URL: process.env.BOLNA_API_URL || "https://api.bolna.ai/calls/make"
};
