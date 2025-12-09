"use client";

import { useState, useEffect } from "react";
import { Database } from "lucide-react";

export default function DebugPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/debug')
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading data...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-white rounded-xl">
                    <Database size={24} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-heading text-slate-900">System Data</h1>
                    <p className="text-slate-500">Raw view of the local database for verification</p>
                </div>
            </div>

            <div className="space-y-8">
                {Object.keys(data || {}).map(key => (
                    <div key={key} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 capitalize">{key}</h2>
                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full">
                                {data[key].length} items
                            </span>
                        </div>
                        <div className="p-0 overflow-x-auto">
                            <pre className="text-xs text-slate-600 p-4 font-mono">
                                {JSON.stringify(data[key], null, 2)}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
