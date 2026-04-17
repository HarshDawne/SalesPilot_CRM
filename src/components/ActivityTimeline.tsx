import { Activity } from "@/lib/db";
import { Phone, MessageCircle, Calendar, FileText, CheckCircle, AlertCircle, StickyNote } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
    activities: Activity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
    if (activities.length === 0) {
        return <div className="text-center py-8 text-gray-500 text-sm">No activities yet.</div>;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "ai_call": return <Phone size={16} className="text-primary" />;
            case "whatsapp": return <MessageCircle size={16} className="text-emerald-600" />;
            case "booking": return <Calendar size={16} className="text-secondary" />;
            case "form_submission": return <FileText size={16} className="text-purple-600" />;
            case "status_change": return <CheckCircle size={16} className="text-slate-600" />;
            case "note": return <StickyNote size={16} className="text-amber-600" />;
            default: return <AlertCircle size={16} className="text-slate-400" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "ai_call": return "bg-primary/5 border-primary/20";
            case "whatsapp": return "bg-emerald-50 border-emerald-100";
            case "booking": return "bg-secondary/5 border-secondary/20";
            case "form_submission": return "bg-purple-50 border-purple-100";
            case "status_change": return "bg-slate-50 border-slate-200";
            case "note": return "bg-amber-50 border-amber-100";
            default: return "bg-slate-50 border-slate-200";
        }
    };

    return (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {activities.map((activity) => (
                <div key={activity.id} className="relative flex items-start group is-active">
                    {/* Icon */}
                    <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white shadow-sm z-10 shrink-0", getBgColor(activity.type).replace("bg-", "border-"))}>
                        {getIcon(activity.type)}
                    </div>

                    {/* Content */}
                    <div className="ml-4 flex-1">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{activity.type.replace("_", " ")}</span>
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-gray-900 text-sm font-medium">{activity.summary}</p>

                            {/* Metadata / Payload details */}
                            {(activity.metadata?.transcript || activity.payload?.transcript) && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md text-xs text-gray-600 italic border-l-2 border-gray-300">
                                    "{activity.metadata?.transcript || activity.payload?.transcript}"
                                </div>
                            )}

                            {(activity.metadata?.oldStatus || activity.payload?.oldStatus) && (
                                <div className="mt-2 text-xs text-gray-500">
                                    Changed from <span className="font-medium text-gray-700">{activity.metadata?.oldStatus || activity.payload?.oldStatus}</span> to <span className="font-medium text-gray-700">{activity.metadata?.newStatus || activity.payload?.newStatus}</span>
                                </div>
                            )}

                            {/* Evidence Links */}
                            {activity.evidence && activity.evidence.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {activity.evidence.map((ev, idx) => (
                                        <a
                                            key={idx}
                                            href={ev.url || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 transition-colors border border-primary/10"
                                        >
                                            {ev.type === 'transcript' && <FileText size={10} />}
                                            {ev.type === 'recording' && <Phone size={10} />}
                                            {ev.type === 'calendar_event' && <Calendar size={10} />}
                                            {ev.type}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
