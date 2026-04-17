import { Suspense } from 'react';
import RenderAdminPanel from '@/components/RenderAdminPanel';

export default function RenderAdminPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-100 border-t-copper"></div>
                    </div>
                }>
                    <RenderAdminPanel />
                </Suspense>
            </div>
        </div>
    );
}

export const metadata = {
    title: '3D Render Admin - Developer Panel',
    description: 'Manage 3D render requests and uploads',
};
