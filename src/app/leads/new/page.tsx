import { WalkInForm } from "@/components/leads/WalkInForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewLeadPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <Link href="/leads" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 text-sm font-medium transition-colors w-fit">
                <ArrowLeft size={16} />
                Back to Leads
            </Link>

            <div>
                <h1 className="text-3xl font-bold text-slate-900">New Lead Entry</h1>
                <p className="text-slate-500">Manual entry for walk-ins, phone inquiries, or referrals.</p>
            </div>

            <WalkInForm />
        </div>
    );
}
