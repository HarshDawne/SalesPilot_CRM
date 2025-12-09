import RenderAdminPanel from '@/components/RenderAdminPanel';

export default function RenderAdminPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <RenderAdminPanel />
            </div>
        </div>
    );
}

export const metadata = {
    title: '3D Render Admin - Developer Panel',
    description: 'Manage 3D render requests and uploads',
};
