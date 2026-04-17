"use client";

import { PipelineBoard } from "@/components/sales/PipelineBoard";
import { Filter, Search, Plus } from "lucide-react";
import Link from "next/link";

export default function SalesPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Sales Toolbar */}
            <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-900">Sales Pipeline</h1>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2">
                            <Filter size={14} /> Filter
                        </button>
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors">
                            My Leads
                        </button>
                        <button className="px-3 py-1.5 bg-transparent text-slate-500 rounded-lg text-sm font-medium hover:text-indigo-600 transition-colors">
                            All Leads
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/leads/new"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> New Lead
                    </Link>
                </div>
            </div>

            {/* Kanban Canvas */}
            <div className="flex-1 overflow-hidden p-0">
                <PipelineBoard />
            </div>
        </div>
    );
}
