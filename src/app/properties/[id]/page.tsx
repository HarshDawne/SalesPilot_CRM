import { notFound } from 'next/navigation';
import PropertyDetailView from '@/components/PropertyDetailView';
import { propertyService, unitService, towerService, documentService } from '@/lib/property-db';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DeletePropertyButton from '@/components/DeletePropertyButton';

interface PropertyDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
    const { id } = await params;

    // Fetch property data
    const property = await propertyService.getById(id);

    if (!property) {
        notFound();
    }

    // Fetch related data
    const towers = await towerService.getByProperty(id);
    const units = await unitService.getByProperty(id);
    const stats = await unitService.getInventoryStats(id);
    const documents = await documentService.getByProperty(id);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <Link
                        href="/properties"
                        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Properties
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/properties/${id}/edit`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                        >
                            Edit Property
                        </Link>
                        <DeletePropertyButton propertyId={id} propertyName={property.name} />
                    </div>
                </div>

                {/* Property Detail View */}
                <PropertyDetailView
                    property={property}
                    towers={towers}
                    units={units}
                    documents={documents}
                    stats={stats}
                />
            </div>
        </div>
    );
}

// Generate metadata for the page
export async function generateMetadata({ params }: PropertyDetailPageProps) {
    const { id } = await params;
    const property = await propertyService.getById(id);

    if (!property) {
        return {
            title: 'Property Not Found',
        };
    }

    return {
        title: `${property.name} - Property Details`,
        description: property.description,
    };
}
