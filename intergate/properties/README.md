# Property Management OS - Mock Data & Integration Guide

## Overview

This module contains fully interactive Property Management UI with **client-side mock data**. All workflows (Projects, Towers, Units, Documents, Media, Pricing, 3D Renders, Activity) use in-memory mock data defined in `mock-data.ts`.

## Mock Data Location

**File**: `src/app/properties/mock-data.ts` (single source of truth)
**State Management**: Zustand store in `src/app/properties/store.ts`

## Data Structure

```typescript
interface Project {
  id: string;
  name: string;
  location: string;
  city: string;
  status: 'Active' | 'Under Construction' | 'Completed';
  totalTowers: number;
  totalUnits: number;
  availableUnits: number;
  bookedUnits: number;
  imageGradient: string;
}

interface Unit {
  id: string;
  projectId: string;
  towerId: string;
  unitNumber: string;
  carpetArea: number;
  builtUpArea: number;
  type: '1BHK' | '2BHK' | '3BHK' | 'Shop' | 'Office';
  status: 'Available' | 'Reserved' | 'Booked' | 'Blocked';
  floor: number;
  facing: string;
  basePrice: number;
  floorRise: number;
  plc: number;
  totalPrice: number;
  reservedUntil?: Date;
  reservedBy?: string;
}

interface ActivityLog {
  id: string;
  type: 'reserve' | 'book' | 'release' | 'block' | 'upload' | 'price_change' | 'purchase_render';
  description: string;
  timestamp: Date;
  projectId?: string;
  unitId?: string;
}
```

### Available Actions

```typescript
// Update unit status (Reserve, Book, Release, Block)
updateUnitStatus(unitId: string, status: Unit['status'], reservedBy?: string)

// Add activity log entry
addActivityLog(activity: Omit<ActivityLog, 'id' | 'timestamp'>)

// Toggle 3D render purchased state
toggleRenderPurchased(renderId: string)

// Update unit pricing
updateUnitPrice(unitId: string, pricing: {
  basePrice: number;
  floorRise: number;
  plc: number;
})
```

## Backend Integration Points

### Replace Mock Data with API Calls

Search for `// TODO:` comments throughout the codebase. Key integration points:

#### 1. Projects API

**Current**: `usePropertyStore((state) => state.projects)`

**Replace with**:
```typescript
// GET /api/properties
const { data: projects } = useQuery(['projects'], fetchProjects);

// POST /api/properties
const createProject = useMutation(
  (data) => axios.post('/api/properties', data)
);
```

#### 2. Units API

**Current**: `usePropertyStore((state) => state.units)`

**Replace with**:
```typescript
// GET /api/units?projectId={id}&towerId={id}
const { data: units } = useQuery(
  ['units', projectId, towerId],
  () => fetchUnits(projectId, towerId)
);

// POST /api/units/{id}/reserve
const reserveUnit = useMutation(
  (unitId) => axios.post(`/api/units/${unitId}/reserve`)
);

// POST /api/units/{id}/book
const bookUnit = useMutation(
  (unitId) => axios.post(`/api/units/${unitId}/book`)
);

// POST /api/units/{id}/release
const releaseUnit = useMutation(
  (unitId) => axios.post(`/api/units/${unitId}/release`)
);
```

#### 3. Activity Log API

**Current**: `usePropertyStore((state) => state.activityLog)`

**Replace with**:
```typescript
// GET /api/activity?projectId={id}
const { data: activityLog } = useQuery(
  ['activity', projectId],
  () => fetchActivityLog(projectId)
);
```

#### 4. Documents & Media API

**Current**: Client-side file preview only

**Replace with**:
```typescript
// POST /api/documents/upload
const uploadDocument = useMutation(
  (formData) => axios.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      const percentage = (progressEvent.loaded / progressEvent.total) * 100;
      setUploadProgress(percentage);
    }
  })
);

// GET /api/documents?projectId={id}
const { data: documents } = useQuery(
  ['documents', projectId],
  () => fetchDocuments(projectId)
);
```

#### 5. 3D Renders API

**Current**: `toggleRenderPurchased(renderId)`

**Replace with**:
```typescript
// POST /api/renders/{id}/purchase
const purchaseRender = useMutation(
  ({ renderId, licenseType }) => 
    axios.post(`/api/renders/${renderId}/purchase`, { licenseType })
);

// GET /api/renders/{id}
const { data: render } = useQuery(
  ['render', renderId],
  () => fetchRender(renderId)
);
```

#### 6. Pricing API

**Current**: `updateUnitPrice(unitId, pricing)`

**Replace with**:
```typescript
// PUT /api/pricing/template
const updatePricingTemplate = useMutation(
  (template) => axios.put('/api/pricing/template', template)
);

// POST /api/pricing/calculate
const calculatePrice = useMutation(
  (unitSpecs) => axios.post('/api/pricing/calculate', unitSpecs)
);
```

## File Structure

```
src/app/properties/
├── store.ts                  # In-memory state management (REPLACE with API calls)
├── page.tsx                  # Main properties dashboard
├── [projectId]/
│   ├── page.tsx             # Project details with tabs
│   ├── towers/
│   │   └── page.tsx         # Tower management
│   ├── units/
│   │   └── page.tsx         # Unit inventory grid
│   ├── pricing/
│   │   └── page.tsx         # Pricing engine
│   ├── documents/
│   │   └── page.tsx         # Document repository
│   ├── media/
│   │   └── page.tsx         # Media gallery
│   └── renders/
│       └── page.tsx         # 3D render workflow
└── inventory/
    └── page.tsx             # Real-time inventory dashboard

src/components/property/
├── UnitDetailsModal.tsx     # Unit details with Reserve/Book actions
├── PricingCalculator.tsx    # Live price preview
├── DocumentUploader.tsx     # Drag-drop file upload
├── MediaGallery.tsx         # Image/video gallery with lightbox
└── ActivityTimeline.tsx     # Activity log timeline
```

## Testing Client-Side Functionality

### 1. Filters & Search
- Navigate to `/properties`
- Try filters: All → Active → Under Construction → Completed
- Search for "Mumbai" or "Skyline"
- Verify empty state when no results

### 2. Unit Reservation Workflow
- Open any project → Navigate to Units
- Click a unit → Unit Details Modal opens
- Click "Reserve" → Status changes to Reserved, timer shows 48h countdown
- Click "Book" → Status changes to Booked
- Verify activity log entry is created

### 3. Pricing Calculator
- Navigate to Project → Pricing tab
- Change base price, floor rise, or PLC
- Verify sample unit price recalculates immediately
- Click "Apply Template" → Success toast appears

### 4. 3D Render Purchase
- Navigate to Project → 3D Renders tab
- Click "Unlock 3D Walkthrough" on unpurchased render
- Mock purchase flow toggles purchased state
- Verify activity log entry

### 5. Responsive Design
- Resize browser to mobile width (<640px)
- Verify filters become horizontal scrollable pills
- Verify cards stack in single column
- Verify all buttons are 44px+ for touch targets

## Migration Checklist

When moving to production with real backend:

- [ ] Replace Zustand store with React Query + API calls
- [ ] Implement real authentication (replace mock user)
- [ ] Add optimistic updates for better UX
- [ ] Implement real file upload with progress tracking
- [ ] Add error handling and retry logic
- [ ] Set up WebSocket for real-time inventory updates
- [ ] Implement cron job for auto-releasing expired reservations
- [ ] Add audit logging for compliance
- [ ] Replace mock payment flow with Razorpay/Stripe
- [ ] Add data export features (Excel, PDF)

## Notes

- All data persists only in browser memory (lost on refresh)
- No server-side validation (add when integrating backend)
- File uploads are simulated (no actual file storage)
- Payment flow is mocked (no real transactions)
- Reservation expiry is UI-only (no auto-release cron)
