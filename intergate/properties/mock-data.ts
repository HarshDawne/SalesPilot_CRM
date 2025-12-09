// Comprehensive mock data for Property Management OS with tower/unit level media, docs, pricing
// TODO: Replace with API calls to backend services

export interface MockProject {
    id: string;
    name: string;
    type: 'Residential' | 'Commercial' | 'Plotting';
    location: {
        city: string;
        area: string;
        address: string;
        landmark: string;
    };
    developer: string;
    reraNumber: string;
    launchDate: string;
    possessionDate: string;
    status: 'Active' | 'Under Construction' | 'Completed';
    imageGradient: string;
    amenities: string[];
    highlights: string[];
    totalTowers: number;
    totalUnits: number;
    availableUnits: number;
    bookedUnits: number;
}

export interface MockTower {
    id: string;
    projectId: string;
    name: string;
    floors: number;
    totalUnits: number;
    availableUnits: number;
    status: 'Planning' | 'Foundation' | 'Structure' | 'Finishing' | 'Ready';
    media: { id: string; type: 'image' | 'video'; url: string; thumbnailUrl: string; caption?: string }[];
    documents: { id: string; name: string; category: string; fileSize: number; url: string }[];
    renders: { id: string; name: string; thumbnailUrl: string; videoUrl?: string; price: number; purchased: boolean }[];
}

export interface MockUnit {
    id: string;
    projectId: string;
    towerId: string;
    unitNumber: string;
    floor: number;
    type: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Shop' | 'Office';
    carpetArea: number;
    builtUpArea: number;
    facing: 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
    view: 'Garden' | 'Sea' | 'Road' | 'Pool' | 'City';
    basePrice: number;
    floorRise: number;
    plc: number;
    otherCharges: number;
    totalPrice: number;
    status: 'Available' | 'Reserved' | 'Booked' | 'Blocked';
    reservedUntil?: string;
    reservedBy?: string;
    renderPurchased: boolean;
    media: { id: string; type: 'image' | 'video'; url: string; thumbnailUrl: string; caption?: string }[];
    documents: { id: string; name: string; category: string; fileSize: number; url: string }[];
}

export interface MockDocument {
    id: string;
    projectId: string;
    unitId?: string;
    name: string;
    category: 'Brochure' | 'Floor Plan' | 'Payment Plan' | 'RERA Certificate' | 'Agreement' | 'Other';
    fileSize: number;
    uploadedAt: string;
    uploadedBy: string;
    url: string;
}

export interface MockMedia {
    id: string;
    projectId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl: string;
    caption?: string;
    uploadedAt: string;
}

export interface MockRender {
    id: string;
    projectId: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    videoUrl?: string;
    price: number;
    purchased: boolean;
}

export interface MockPricingTemplate {
    projectId: string;
    basePricePerSqft: number;
    floorRisePercentage: number;
    plcCharges: {
        corner: number;
        parkFacing: number;
        roadFacing: number;
        seaView: number;
    };
    otherCharges: number;
}

export interface MockActivity {
    id: string;
    projectId: string;
    unitId?: string;
    type: 'reserve' | 'book' | 'release' | 'block' | 'upload_document' | 'upload_media' | 'purchase_render' | 'price_change';
    description: string;
    timestamp: string;
    user: string;
}

// Mock Projects
export const mockProjects: MockProject[] = [
    {
        id: 'proj-001',
        name: 'Skyline Residency',
        type: 'Residential',
        location: {
            city: 'Mumbai',
            area: 'Andheri West',
            address: 'Plot No. 45, S.V. Road',
            landmark: 'Near Infinity Mall',
        },
        developer: 'Skyline Developers Pvt Ltd',
        reraNumber: 'P51800012345',
        launchDate: '2023-01-15',
        possessionDate: '2025-12-31',
        status: 'Active',
        imageGradient: 'from-indigo-500 to-purple-600',
        amenities: ['Swimming Pool', 'Gymnasium', 'Clubhouse', 'Kids Play Area', 'Security', 'Power Backup', 'Landscaped Gardens', 'Jogging Track'],
        highlights: [
            'RERA approved premium project',
            'Located in prime Andheri West',
            '5 minutes from Metro Station',
            'Top-rated schools nearby',
            'Shopping malls within 1km',
            '24/7 Security with CCTV',
        ],
        totalTowers: 3,
        totalUnits: 120,
        availableUnits: 45,
        bookedUnits: 65,
    },
    {
        id: 'proj-002',
        name: 'Green Valley Homes',
        type: 'Residential',
        location: {
            city: 'Pune',
            area: 'Hinjewadi',
            address: 'Survey No. 123, Hinjewadi Phase 2',
            landmark: 'Near Rajiv Gandhi Infotech Park',
        },
        developer: 'Green Valley Constructions',
        reraNumber: 'P52100045678',
        launchDate: '2024-03-01',
        possessionDate: '2026-06-30',
        status: 'Under Construction',
        imageGradient: 'from-emerald-500 to-teal-600',
        amenities: ['Organic Garden', 'Jogging Track', 'Yoga Center', 'Solar Panels', 'Rainwater Harvesting', 'EV Charging'],
        highlights: [
            'Eco-friendly green building',
            'Solar power generation',
            'Organic waste management',
            'Near IT parks and tech companies',
            'Excellent connectivity',
        ],
        totalTowers: 4,
        totalUnits: 180,
        availableUnits: 95,
        bookedUnits: 70,
    },
    {
        id: 'proj-003',
        name: 'Urban Square',
        type: 'Commercial',
        location: {
            city: 'Bangalore',
            area: 'Whitefield',
            address: 'EPIP Zone, Whitefield',
            landmark: 'Near Phoenix Marketcity',
        },
        developer: 'Urban Spaces Ltd',
        reraNumber: 'PRM/KA/RERA/1251/309/PR/171003/001932',
        launchDate: '2022-06-01',
        possessionDate: '2024-12-31',
        status: 'Active',
        imageGradient: 'from-blue-500 to-cyan-600',
        amenities: ['Retail Space', 'Food Court', 'Office Spaces', 'Parking', 'Elevators', 'Conference Rooms'],
        highlights: [
            'Mixed-use development',
            'Direct Metro connectivity',
            'Tech park nearby',
            'Premium retail brands',
            'High footfall area',
        ],
        totalTowers: 2,
        totalUnits: 85,
        availableUnits: 30,
        bookedUnits: 50,
    },
];

// Mock Towers with media, documents, and renders
export const mockTowers: MockTower[] = [
    {
        id: 'tower-001',
        projectId: 'proj-001',
        name: 'Tower A',
        floors: 20,
        totalUnits: 40,
        availableUnits: 15,
        status: 'Ready',
        media: [
            { id: 'tower-media-001', type: 'image', url: '/media/tower-a-exterior.jpg', thumbnailUrl: '/media/thumb/tower-a-exterior.jpg', caption: 'Tower A Exterior View' },
            { id: 'tower-media-002', type: 'image', url: '/media/tower-a-lobby.jpg', thumbnailUrl: '/media/thumb/tower-a-lobby.jpg', caption: 'Entrance Lobby' },
            { id: 'tower-media-003', type: 'image', url: '/media/tower-a-amenities.jpg', thumbnailUrl: '/media/thumb/tower-a-amenities.jpg', caption: 'Amenities Floor' },
        ],
        documents: [
            { id: 'tower-doc-001', name: 'Tower A Floor Plans.pdf', category: 'Floor Plan', fileSize: 3145728, url: '/docs/tower-a-plans.pdf' },
            { id: 'tower-doc-002', name: 'Tower A Specifications.pdf', category: 'Specifications', fileSize: 2097152, url: '/docs/tower-a-specs.pdf' },
        ],
        renders: [
            { id: 'tower-render-001', name: 'Tower A Aerial View', thumbnailUrl: '/renders/tower-a-aerial-thumb.jpg', videoUrl: '/renders/tower-a-aerial.mp4', price: 8000, purchased: true },
        ],
    },
    {
        id: 'tower-002',
        projectId: 'proj-001',
        name: 'Tower B',
        floors: 20,
        totalUnits: 40,
        availableUnits: 18,
        status: 'Ready',
        media: [
            { id: 'tower-media-004', type: 'image', url: '/media/tower-b-exterior.jpg', thumbnailUrl: '/media/thumb/tower-b-exterior.jpg', caption: 'Tower B Exterior' },
        ],
        documents: [
            { id: 'tower-doc-003', name: 'Tower B Floor Plans.pdf', category: 'Floor Plan', fileSize: 3145728, url: '/docs/tower-b-plans.pdf' },
        ],
        renders: [],
    },
    {
        id: 'tower-003',
        projectId: 'proj-001',
        name: 'Tower C',
        floors: 20,
        totalUnits: 40,
        availableUnits: 12,
        status: 'Finishing',
        media: [],
        documents: [],
        renders: [],
    },
    { id: 'tower-004', projectId: 'proj-002', name: 'Block A', floors: 15, totalUnits: 45, availableUnits: 25, status: 'Structure', media: [], documents: [], renders: [] },
    { id: 'tower-005', projectId: 'proj-002', name: 'Block B', floors: 15, totalUnits: 45, availableUnits: 22, status: 'Structure', media: [], documents: [], renders: [] },
    { id: 'tower-006', projectId: 'proj-002', name: 'Block C', floors: 15, totalUnits: 45, availableUnits: 24, status: 'Foundation', media: [], documents: [], renders: [] },
    { id: 'tower-007', projectId: 'proj-002', name: 'Block D', floors: 15, totalUnits: 45, availableUnits: 24, status: 'Planning', media: [], documents: [], renders: [] },
    { id: 'tower-008', projectId: 'proj-003', name: 'North Wing', floors: 12, totalUnits: 42, availableUnits: 15, status: 'Ready', media: [], documents: [], renders: [] },
    { id: 'tower-009', projectId: 'proj-003', name: 'South Wing', floors: 10, totalUnits: 43, availableUnits: 15, status: 'Ready', media: [], documents: [], renders: [] },
];

// Mock Units with media and documents
export const mockUnits: MockUnit[] = [
    {
        id: 'unit-001',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-101',
        floor: 1,
        type: '2BHK',
        carpetArea: 850,
        builtUpArea: 1200,
        facing: 'North',
        view: 'Garden',
        basePrice: 50000,
        floorRise: 100000,
        plc: 500000,
        otherCharges: 150000,
        totalPrice: 43150000,
        status: 'Available',
        renderPurchased: false,
        media: [
            { id: 'unit-media-001', type: 'image', url: '/media/unit-a101-living.jpg', thumbnailUrl: '/media/thumb/unit-a101-living.jpg', caption: 'Living Room' },
            { id: 'unit-media-002', type: 'image', url: '/media/unit-a101-bedroom.jpg', thumbnailUrl: '/media/thumb/unit-a101-bedroom.jpg', caption: 'Master Bedroom' },
        ],
        documents: [
            { id: 'unit-doc-001', name: 'Unit A-101 Floor Plan.pdf', category: 'Floor Plan', fileSize: 524288, url: '/docs/unit-a101-plan.pdf' },
            { id: 'unit-doc-002', name: 'Payment Schedule - A101.pdf', category: 'Payment Plan', fileSize: 204800, url: '/docs/unit-a101-payment.pdf' },
        ],
    },
    {
        id: 'unit-002',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-102',
        floor: 1,
        type: '3BHK',
        carpetArea: 1200,
        builtUpArea: 1650,
        facing: 'East',
        view: 'City',
        basePrice: 50000,
        floorRise: 100000,
        plc: 750000,
        otherCharges: 200000,
        totalPrice: 61050000,
        status: 'Reserved',
        reservedUntil: new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString(),
        reservedBy: 'Rajesh Kumar',
        renderPurchased: true,
        media: [
            { id: 'unit-media-003', type: 'image', url: '/media/unit-a102-living.jpg', thumbnailUrl: '/media/thumb/unit-a102-living.jpg', caption: '3BHK Living Area' },
        ],
        documents: [
            { id: 'unit-doc-003', name: 'Unit A-102 Floor Plan.pdf', category: 'Floor Plan', fileSize: 614400, url: '/docs/unit-a102-plan.pdf' },
        ],
    },
    {
        id: 'unit-003',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-201',
        floor: 2,
        type: '2BHK',
        carpetArea: 850,
        builtUpArea: 1200,
        facing: 'South',
        view: 'Pool',
        basePrice: 50000,
        floorRise: 200000,
        plc: 500000,
        otherCharges: 150000,
        totalPrice: 43350000,
        status: 'Available',
        renderPurchased: false,
        media: [],
        documents: [],
    },
    {
        id: 'unit-004',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-202',
        floor: 2,
        type: '3BHK',
        carpetArea: 1200,
        builtUpArea: 1650,
        facing: 'West',
        view: 'City',
        basePrice: 50000,
        floorRise: 200000,
        plc: 750000,
        otherCharges: 200000,
        totalPrice: 61150000,
        status: 'Booked',
        renderPurchased: false,
        media: [],
        documents: [],
    },
    {
        id: 'unit-005',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-301',
        floor: 3,
        type: '2BHK',
        carpetArea: 850,
        builtUpArea: 1200,
        facing: 'North',
        view: 'Garden',
        basePrice: 50000,
        floorRise: 300000,
        plc: 500000,
        otherCharges: 150000,
        totalPrice: 43550000,
        status: 'Available',
        renderPurchased: false,
        media: [],
        documents: [],
    },
    {
        id: 'unit-006',
        projectId: 'proj-001',
        towerId: 'tower-001',
        unitNumber: 'A-302',
        floor: 3,
        type: '3BHK',
        carpetArea: 1200,
        builtUpArea: 1650,
        facing: 'East',
        view: 'City',
        basePrice: 50000,
        floorRise: 300000,
        plc: 750000,
        otherCharges: 200000,
        totalPrice: 61250000,
        status: 'Blocked',
        renderPurchased: false,
        media: [],
        documents: [],
    },
];

// Mock Documents
export const mockDocuments: MockDocument[] = [
    {
        id: 'doc-001',
        projectId: 'proj-001',
        name: 'Project Brochure.pdf',
        category: 'Brochure',
        fileSize: 2457600,
        uploadedAt: '2024-01-15T10:30:00Z',
        uploadedBy: 'Admin',
        url: '/documents/brochure.pdf',
    },
    {
        id: 'doc-002',
        projectId: 'proj-001',
        name: 'Project Master Plan.pdf',
        category: 'Floor Plan',
        fileSize: 5242880,
        uploadedAt: '2024-02-01T14:20:00Z',
        uploadedBy: 'Architect',
        url: '/documents/master-plan.pdf',
    },
    {
        id: 'doc-003',
        projectId: 'proj-001',
        name: 'Payment Schedule.pdf',
        category: 'Payment Plan',
        fileSize: 1048576,
        uploadedAt: '2024-01-20T09:15:00Z',
        uploadedBy: 'Finance Team',
        url: '/documents/payment.pdf',
    },
    {
        id: 'doc-004',
        projectId: 'proj-001',
        name: 'RERA Certificate.pdf',
        category: 'RERA Certificate',
        fileSize: 3145728,
        uploadedAt: '2024-01-10T11:00:00Z',
        uploadedBy: 'Legal',
        url: '/documents/rera.pdf',
    },
];

// Mock Media
export const mockMedia: MockMedia[] = [
    {
        id: 'media-001',
        projectId: 'proj-001',
        type: 'image',
        url: '/media/exterior-1.jpg',
        thumbnailUrl: '/media/thumb/exterior-1.jpg',
        caption: 'Exterior View - Main Entrance',
        uploadedAt: '2024-01-15T10:00:00Z',
    },
    {
        id: 'media-002',
        projectId: 'proj-001',
        type: 'image',
        url: '/media/lobby.jpg',
        thumbnailUrl: '/media/thumb/lobby.jpg',
        caption: 'Luxurious Lobby',
        uploadedAt: '2024-01-15T10:05:00Z',
    },
    {
        id: 'media-003',
        projectId: 'proj-001',
        type: 'image',
        url: '/media/pool.jpg',
        thumbnailUrl: '/media/thumb/pool.jpg',
        caption: 'Swimming Pool',
        uploadedAt: '2024-01-15T10:10:00Z',
    },
    {
        id: 'media-004',
        projectId: 'proj-001',
        type: 'video',
        url: '/media/walkthrough.mp4',
        thumbnailUrl: '/media/thumb/walkthrough.jpg',
        caption: 'Project Walkthrough',
        uploadedAt: '2024-01-20T15:30:00Z',
    },
];

// Mock 3D Renders
export const mockRenders: MockRender[] = [
    {
        id: 'render-001',
        projectId: 'proj-001',
        name: 'Aerial View - Complete Project',
        description: 'Complete aerial view showing all 3 towers and landscaping',
        thumbnailUrl: '/renders/aerial-thumb.jpg',
        videoUrl: '/renders/aerial-full.mp4',
        price: 10000,
        purchased: false,
    },
    {
        id: 'render-002',
        projectId: 'proj-001',
        name: 'Sample 3BHK Apartment',
        description: 'Interior walkthrough of 3BHK unit with furnishing',
        thumbnailUrl: '/renders/3bhk-thumb.jpg',
        videoUrl: '/renders/3bhk-full.mp4',
        price: 5000,
        purchased: true,
    },
];

// Mock Pricing Templates
export const mockPricingTemplates: Record<string, MockPricingTemplate> = {
    'proj-001': {
        projectId: 'proj-001',
        basePricePerSqft: 50000,
        floorRisePercentage: 2,
        plcCharges: {
            corner: 300000,
            parkFacing: 500000,
            roadFacing: 200000,
            seaView: 1000000,
        },
        otherCharges: 150000,
    },
};

// Mock Activity Log
export const mockActivityLog: MockActivity[] = [
    {
        id: 'activity-001',
        projectId: 'proj-001',
        unitId: 'unit-002',
        type: 'reserve',
        description: 'Unit A-102 reserved by Rajesh Kumar',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        user: 'Sales Agent',
    },
    {
        id: 'activity-002',
        projectId: 'proj-001',
        unitId: 'unit-004',
        type: 'book',
        description: 'Unit A-202 booked by Priya Sharma',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        user: 'Sales Agent',
    },
    {
        id: 'activity-003',
        projectId: 'proj-001',
        type: 'upload_document',
        description: 'Uploaded Payment Schedule.pdf',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        user: 'Finance Team',
    },
    {
        id: 'activity-004',
        projectId: 'proj-001',
        type: 'purchase_render',
        description: 'Purchased 3D Render: Sample 3BHK Apartment',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        user: 'Marketing Team',
    },
];
