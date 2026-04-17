
export interface DemoUnit {
    id: string;
    unitNo: string;
    floor: number;
    bhk: string;
    carpetArea: number;
    price: number;
    facing: string;
    status: 'available' | 'booked' | 'sold' | 'blocked';
}

export interface DemoTower {
    id: string;
    name: string;
    floors: number;
    possessionDate: string;
    status: string;
    units: DemoUnit[];
}

export interface DemoProperty {
    id: string;
    name: string;
    city: string;
    microMarket: string;
    developer: string;
    status: 'PLANNING' | 'UNDER_CONSTRUCTION' | 'READY_TO_MOVE' | 'SOLD_OUT' | 'PRE_LAUNCH';
    projectType: 'Residential' | 'Commercial' | 'Mixed Use';
    heroImage: string;
    startingPrice: number;
    highestPrice: number;
    totalTowers: number;
    totalUnits: number;
    towers: DemoTower[];
    description?: string;
}

export const DEMO_PROPERTIES: DemoProperty[] = [
    {
        id: "prop_1",
        name: "Aurum Sky Residencies",
        city: "Mumbai",
        microMarket: "Worli Sea Face",
        developer: "Aurum Group",
        status: "UNDER_CONSTRUCTION",
        projectType: "Residential",
        heroImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
        startingPrice: 45000000,
        highestPrice: 125000000,
        totalTowers: 2,
        totalUnits: 120,
        description: "Ultra-luxury sea-facing apartments with private decks and world-class amenities.",
        towers: [
            {
                id: "tower_1",
                name: "Tower A - Azure",
                floors: 30,
                possessionDate: "2026-12-01",
                status: "Structural Complete",
                units: [
                    { id: "u_1", unitNo: "101", floor: 1, bhk: "3 BHK", carpetArea: 1850, price: 45000000, facing: "Sea View", status: "available" },
                    { id: "u_2", unitNo: "102", floor: 1, bhk: "4 BHK", carpetArea: 2400, price: 65000000, facing: "City View", status: "sold" },
                    { id: "u_3", unitNo: "201", floor: 2, bhk: "3 BHK", carpetArea: 1850, price: 46000000, facing: "Sea View", status: "blocked" }
                ]
            },
            {
                id: "tower_2",
                name: "Tower B - Cobalt",
                floors: 35,
                possessionDate: "2027-06-01",
                status: "Plinth Level",
                units: []
            }
        ]
    },
    {
        id: "prop_2",
        name: "TechPark One",
        city: "Bengaluru",
        microMarket: "Whitefield",
        developer: "Prestige Estates",
        status: "READY_TO_MOVE",
        projectType: "Commercial",
        heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
        startingPrice: 15000000,
        highestPrice: 85000000,
        totalTowers: 3,
        totalUnits: 45,
        description: "Grade A office spaces with LEED Platinum certification.",
        towers: [
            {
                id: "t_1", name: "Alpha Block", floors: 12, possessionDate: "2024-01-01", status: "Operational",
                units: [
                    { id: "u_11", unitNo: "101", floor: 1, bhk: "Office Deck", carpetArea: 3500, price: 45000000, facing: "Garden", status: "available" }
                ]
            }
        ]
    },
    {
        id: "prop_3",
        name: "Lakeside Greens",
        city: "Pune",
        microMarket: "Hinjewadi",
        developer: "Godrej Properties",
        status: "PRE_LAUNCH",
        projectType: "Residential",
        heroImage: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop",
        startingPrice: 8500000,
        highestPrice: 15000000,
        totalTowers: 6,
        totalUnits: 450,
        description: "Integrated township living amidst nature.",
        towers: [
            { id: "t_g1", name: "Grove A", floors: 22, possessionDate: "2028-01-01", status: "Pre-Launch", units: [] }
        ]
    },
    {
        id: "prop_4",
        name: "Capital Towers",
        city: "Gurugram",
        microMarket: "Golf Course Road",
        developer: "DLF",
        status: "PLANNING",
        projectType: "Mixed Use",
        heroImage: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop",
        startingPrice: 55000000,
        highestPrice: 250000000,
        totalTowers: 1,
        totalUnits: 80,
        description: "Iconic mixed-use development in the heart of the city.",
        towers: []
    },
    {
        id: "prop_5",
        name: "Serenity Scapes",
        city: "Hyderabad",
        microMarket: "Gachibowli",
        developer: "My Home Group",
        status: "SOLD_OUT",
        projectType: "Residential",
        heroImage: "https://images.unsplash.com/photo-1600596542815-a2512fdb634a?q=80&w=2070&auto=format&fit=crop",
        startingPrice: 12000000,
        highestPrice: 22000000,
        totalTowers: 4,
        totalUnits: 320,
        description: "Premium gated community fully sold out.",
        towers: [
            {
                id: "t_s1", name: "Tower 1", floors: 18, possessionDate: "2023-05-01", status: "Handed Over",
                units: [
                    { id: "u_s1", unitNo: "1804", floor: 18, bhk: "3 BHK", carpetArea: 1650, price: 12500000, facing: "Pool", status: "sold" }
                ]
            }
        ]
    }
];
