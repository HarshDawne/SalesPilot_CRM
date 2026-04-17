import { z } from 'zod';

// Lead validation schema
export const LeadCreateSchema = z.object({
  // Required fields
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name contains invalid characters'),
  
  phone: z.string()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format (E.164)'),
  
  // Optional fields
  email: z.string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  
  source: z.enum(['WEBSITE', 'FB_ADS', 'GOOGLE_ADS', 'META', 'REFERRAL', 'DIRECT', 'OTHER'])
    .optional()
    .default('WEBSITE'),
  
  budgetMin: z.number()
    .min(0)
    .max(10000000000) // 1000 Cr max
    .optional(),
  
  budgetMax: z.number()
    .min(0)
    .max(10000000000)
    .optional(),
  
  preferredLocation: z.string().max(200).optional(),
  
  unitType: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'Duplex', 'Villa', 'Penthouse'])
    .optional(),
  
  // Website integration fields
  page_url: z.string().url().max(500).optional(),
  form_id: z.string().max(100).optional(),
  
  utm: z.record(z.string(), z.string()).optional(),
  
  device: z.object({
    ip: z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, "Invalid IP address").optional(),
    user_agent: z.string().max(500).optional(),
    session_id: z.string().max(100).optional(),
  }).optional(),
  
  consent: z.boolean().optional(),
  
  dedupe_key: z.string().max(100).optional(),
  
  // Honeypot (should always be empty)
  hp_field: z.string().max(0).optional(),
}).refine(
  (data) => !data.budgetMax || !data.budgetMin || data.budgetMax >= data.budgetMin,
  { message: 'Budget max must be greater than budget min' }
);

// Lead update schema (all fields optional)
export const LeadUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/).optional(),
  budgetMin: z.number().min(0).max(10000000000).optional(),
  budgetMax: z.number().min(0).max(10000000000).optional(),
  preferredLocation: z.string().max(200).optional(),
  unitType: z.enum(['1BHK', '2BHK', '3BHK', '4BHK', 'Duplex', 'Villa', 'Penthouse']).optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  score: z.number().min(0).max(100).optional(),
});

// Booking validation schema
export const BookingCreateSchema = z.object({
  leadId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  slotStart: z.string().datetime(),
  slotEnd: z.string().datetime(),
  mode: z.enum(['site_visit', 'virtual_meeting']).default('site_visit'),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => new Date(data.slotEnd) > new Date(data.slotStart),
  { message: 'End time must be after start time' }
);

// Activity validation schema
export const ActivityCreateSchema = z.object({
  leadId: z.string().uuid(),
  type: z.enum([
    'form_submission',
    'ai_call',
    'whatsapp',
    'booking',
    'status_change',
    'note',
    'call_initiated',
    'call_qualified',
    'wa_sent',
    'wa_delivered',
    'calendar_event_created'
  ]),
  summary: z.string().min(1).max(500),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Webhook validation schema
export const WebhookCallLogSchema = z.object({
  event_id: z.string().min(1).max(100),
  job_id: z.string().optional(),
  lead_id: z.string().uuid(),
  call_sid: z.string().optional(),
  status: z.enum(['answered', 'no_answer', 'busy', 'failed', 'cancelled']),
  summary: z.string().max(2000).optional(),
  confidence: z.number().min(0).max(1).optional(),
  transcript_url: z.string().url().optional(),
  recording_url: z.string().url().optional(),
  provider: z.string().max(50).optional(),
  timestamp: z.string().datetime().optional(),
  booking_details: z.object({
    slot_start: z.string().datetime(),
    slot_end: z.string().datetime().optional(),
    mode: z.enum(['site_visit', 'virtual_meeting']).optional(),
  }).optional(),
});

// Helper function to validate and sanitize
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

// Data masking functions
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : local;
  return `${maskedLocal}@${domain}`;
}

export function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.**`;
  }
  return '***.***.***.**';
}

// Sanitize lead data for API response
export function sanitizeLeadForResponse(lead: any, userRole?: string): any {
  // Admins see everything
  if (userRole === 'admin') return lead;
  
  // Other users see masked data
  return {
    ...lead,
    phone: maskPhone(lead.phone),
    email: lead.email ? maskEmail(lead.email) : undefined,
    device: lead.device ? {
      ...lead.device,
      ip: lead.device.ip ? maskIP(lead.device.ip) : undefined,
    } : undefined,
  };
}
