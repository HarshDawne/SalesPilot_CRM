import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { Lead } from "@/lib/db";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Phone, Calendar, User } from "lucide-react";

interface KanbanBoardProps {
    leads: Lead[];
    onStatusChange: (leadId: string, newStatus: string) => void;
}

const COLUMNS = [
    { id: "New", title: "New Leads", color: "bg-blue-50 border-blue-100" },
    { id: "AI_Calling", title: "AI Calling", color: "bg-indigo-50 border-indigo-100" },
    { id: "Qualified", title: "Qualified", color: "bg-purple-50 border-purple-100" },
    { id: "Visit_Booked", title: "Visits", color: "bg-orange-50 border-orange-100" },
    { id: "Negotiation", title: "Negotiation", color: "bg-pink-50 border-pink-100" },
    { id: "Booking_Done", title: "Won", color: "bg-emerald-50 border-emerald-100" },
];

export default function KanbanBoard({ leads, onStatusChange }: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const leadId = active.id as string;
            const newStatus = over.id as string;

            // Only update if status is different
            const lead = leads.find(l => l.id === leadId);
            if (lead && lead.currentStage !== newStatus) {
                onStatusChange(leadId, newStatus);
            }
        }
        setActiveId(null);
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)] min-h-[500px]">
                {COLUMNS.map((col) => (
                    <DroppableColumn key={col.id} id={col.id} title={col.title} className={col.color}>
                        {leads
                            .filter((lead) => lead.currentStage === col.id)
                            .map((lead) => (
                                <DraggableCard key={lead.id} lead={lead} />
                            ))}
                    </DroppableColumn>
                ))}
            </div>
            <DragOverlay>
                {activeId ? (
                    <LeadCard lead={leads.find((l) => l.id === activeId)!} isOverlay />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function DroppableColumn({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div ref={setNodeRef} className={cn("flex-shrink-0 w-80 rounded-xl p-4 flex flex-col gap-3 border", className)}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-700">{title}</h3>
                <span className="text-xs font-medium bg-white/50 px-2 py-1 rounded-full text-slate-500">
                    {Array.isArray(children) ? children.length : 0}
                </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {children}
            </div>
        </div>
    );
}

function DraggableCard({ lead }: { lead: Lead }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-50")}>
            <LeadCard lead={lead} />
        </div>
    );
}

function LeadCard({ lead, isOverlay }: { lead: Lead; isOverlay?: boolean }) {
    return (
        <div className={cn(
            "bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow",
            isOverlay && "shadow-xl rotate-2 scale-105 ring-2 ring-indigo-500"
        )}>
            <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-slate-900 truncate">{lead.firstName} {lead.lastName}</h4>
                {lead.aiScore && (
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", lead.aiScore > 70 ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
                        {lead.aiScore}
                    </span>
                )}
            </div>
            <div className="space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                    <Phone size={12} /> {lead.primaryPhone}
                </div>
                {lead.budgetMin && (
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">₹{(lead.budgetMin / 100000).toFixed(0)}L+</span>
                    </div>
                )}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 mt-2">
                    <Calendar size={12} />
                    {lead.createdAt ? formatDistanceToNow(new Date(lead.createdAt)) + " ago" : "Just now"}
                </div>
            </div>
        </div>
    );
}
