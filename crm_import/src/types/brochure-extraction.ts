/**
 * Types for AI-powered brochure extraction
 */

/**
 * Interface matching AI extraction output from property brochures
 * All fields are optional as AI may not be able to extract all information
 */
export interface BrochureExtractedData {
  // Basic Info
  name?: string;
  developerName?: string;
  tagline?: string;
  description?: string;
  projectType?: "RESIDENTIAL" | "COMMERCIAL" | "MIXED_USE";
  status?: "ACTIVE" | "UNDER_CONSTRUCTION" | "COMPLETED" | "ON_HOLD";
  
  // Location
  city?: string;
  locality?: string;
  pincode?: string;
  fullAddress?: string;
  landmark?: string;
  googleMapsUrl?: string;
  
  // Regulatory
  reraId?: string;
  reraUrl?: string;
  expectedCompletion?: string; // ISO date string or YYYY-MM format
  launchDate?: string;
  possessionFrom?: string;
  
  // Inventory Summary
  totalTowers?: number;
  totalUnits?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
  
  // Pricing
  startingPrice?: number;
  pricePerSqftFrom?: number;
  pricePerSqftTo?: number;
  bookingAmount?: number;
  paymentPlanType?: "CONSTRUCTION_LINKED" | "TIME_LINKED" | "DOWN_PAYMENT" | "FLEXI" | "OTHER";
  
  // Marketing
  highlights?: string[];
  amenities?: string[];
  brochureUrl?: string; // URL of the uploaded brochure file
  
  // Unit Mix (for future use - currently just informational)
  unitMix?: Array<{
    bhkType?: string;
    areaRange?: string;
    tower?: string;
    count?: number;
    notes?: string;
  }>;
}

/**
 * Response from the brochure import API
 */
export interface BrochureImportResponse {
  success: boolean;
  data?: BrochureExtractedData;
  error?: string;
  extractionId?: string; // Unique ID for this extraction (for caching/debugging)
  warnings?: string[]; // Partial extraction warnings
}

/**
 * Cached extraction data stored temporarily on server
 */
export interface CachedExtraction {
  id: string;
  data: BrochureExtractedData;
  createdAt: string;
  expiresAt: string;
}
