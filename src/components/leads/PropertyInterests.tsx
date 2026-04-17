"use client";

import { Home, Eye, Heart, Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyInterest {
    propertyId: string;
    propertyName: string;
    status: "viewed" | "interested" | "visit_scheduled";
    addedAt: string;
}

interface PropertyInterestsProps {
    interests: PropertyInterest[];
}

export function PropertyInterests({ interests }: PropertyInterestsProps) {
    const getStatusStyles = (status: PropertyInterest['status']) => {
        switch (status) {
            case "viewed": return "bg-slate-100 text-slate-600 border-slate-200";
            case "interested": return "bg-rose-50 text-rose-600 border-rose-100";
            case "visit_scheduled": return "bg-primary/5 text-primary border-primary/20";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const getStatusIcon = (status: PropertyInterest['status']) => {
        switch (status) {
            case "viewed": return <Eye size={12} />;
            case "interested": return <Heart size={12} />;
            case "visit_scheduled": return <Calendar size={12} />;
        }
    };

    return (
        <div className="card-premium p-6 bg-white overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-black text-text-main uppercase tracking-[0.2em] flex items-center gap-2">
                    <Home size={14} className="text-primary" />
                    Interested Properties
                </h3>
            </div>

            {interests.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Properties Linked</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {interests.map((prop, idx) => (
                        <div 
                            key={idx} 
                            className="group p-4 rounded-2xl border border-border-subtle hover:border-primary/20 hover:bg-slate-50/50 transition-all"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-black text-text-main tracking-tight group-hover:text-primary transition-colors">
                                    {prop.propertyName}
                                </span>
                                <div className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border",
                                    getStatusStyles(prop.status)
                                )}>
                                    {getStatusIcon(prop.status)}
                                    {prop.status.replace('_', ' ')}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Added {new Date(prop.addedAt).toLocaleDateString()}</span>
                                <button className="text-[9px] font-black text-primary uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    View Project <ArrowRight size={10} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
