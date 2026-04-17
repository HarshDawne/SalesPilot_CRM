import { Suspense } from 'react';
import RenderAdminPanel from '@/components/RenderAdminPanel';

export default function RenderAdminPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-100 border-t-slate-900"></div>
            </div>
        }>
            <RenderAdminPanel />
        </Suspense>
    );
}
