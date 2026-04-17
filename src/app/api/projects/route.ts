import { NextResponse } from 'next/server';
import { propertyService } from '@/lib/property-db';

export async function GET() {
    // Return actual properties transformed into "Projects" for the calendar
    const propertiesData = await propertyService.getAll();
    // Ensure we have an array
    const properties = Array.isArray(propertiesData) ? propertiesData : [];

    // Return the full property object so consumers like CampaignWizard have access to location, etc.
    // We can still add the 'color' field for the calendar if needed, or consumers can default it.
    const projects = properties.map(p => ({
        ...p,
        color: 'blue' // mock color for calendar
    }));

    return NextResponse.json(projects);
}
