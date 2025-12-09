# AI-Powered Brochure Import Feature

## Quick Start

This feature allows builders to upload project brochure PDFs and automatically extract property details using AI.

### Setup (Optional - Works Without)

To enable real AI extraction, add to your `.env.local` file:

```bash
GEMINI_API_KEY=your_api_key_here
```

**Get a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key
4. Add to `.env.local`
5. Restart dev server: `npm run dev`

### Without API Key

The feature works in **mock mode** automatically:
- Returns realistic sample property data
- Perfect for development and testing
- Console will indicate "Using mock extraction"

## Usage

1. Navigate to `/properties`
2. Click **"Import from Brochure (AI)"** button
3. Upload a PDF brochure (max 10MB)
4. Wait for AI extraction (10-30 seconds)
5. Review pre-filled form fields
6. Edit as needed
7. Click **"Create Property"**

## Features

✅ Extracts 30+ property fields from PDF brochures
✅ No silent auto-creation - user must confirm
✅ Works without API key (mock mode)
✅ Beautiful animated UI
✅ Comprehensive error handling
✅ Form validation still applies

## What Gets Extracted

- **Basic Info:** Name, Developer, Type, Status, Description
- **Location:** City, Locality, Pincode, Full Address, Google Maps URL
- **Regulatory:** RERA ID, Launch Date, Completion Date
- **Inventory:** Total Towers, Total Units, Bedrooms, Area (sqft)
- **Pricing:** Starting Price, Price/sqft, Booking Amount
- **Marketing:** Amenities, Highlights, Unit Mix

## Error Handling

If extraction fails, users can:
- Retry upload
- Fill form manually
- Partial extraction is supported

## Development Notes

### Testing Without API Key
- Mock mode generates realistic sample data
- Useful for testing UI flow
- Check console for "Using mock extraction" message

### Testing With Real Brochures
- PDF only (max 10MB)
- Clear text is better than scanned images
- More detailed brochures = better extraction

### Caching
- Extracted data cached for 1 hour
- Allows page refresh without re-extraction
- In-memory cache (upgradeable to Redis)

## Technical Details

See [walkthrough.md](../../.gemini/antigravity/brain/087218b7-9a6d-4662-84d4-bfa9d5d97e57/walkthrough.md) for complete implementation details.
