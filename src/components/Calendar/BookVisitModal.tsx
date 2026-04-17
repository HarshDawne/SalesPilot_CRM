"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, User } from 'lucide-react';
import { Lead, Project, Property } from '@/lib/db';

interface BookVisitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    selectedDate?: Date;
}

export default function BookVisitModal({ isOpen, onClose, onSuccess, selectedDate }: BookVisitModalProps) {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        leadId: '',
        projectId: '',
        propertyId: '',
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 60,
        mode: 'site_visit',
        visitType: 'first_visit',
        meetingPoint: '',
        notes: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (formData.projectId) {
            fetchProperties(formData.projectId);
        }
    }, [formData.projectId]);

    const fetchData = async () => {
        try {
            const [leadsRes, projectsRes] = await Promise.all([
                fetch('/api/leads'),
                fetch('/api/projects')
            ]);
            setLeads(await leadsRes.json());
            setProjects(await projectsRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const fetchProperties = async (projectId: string) => {
        try {
            const res = await fetch(`/api/properties?projectId=${projectId}`);
            const data = await res.json();
            setProperties(data.data || []);
        } catch (error) {
            console.error('Error fetching properties:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${formData.date}T${formData.time}`);
            const endDateTime = new Date(startDateTime.getTime() + formData.duration * 60000);

            const project = projects.find(p => p.id === formData.projectId);

            const booking = {
                leadId: formData.leadId,
                projectId: formData.projectId || undefined,
                propertyId: formData.propertyId || undefined,
                slotStart: startDateTime.toISOString(),
                slotEnd: endDateTime.toISOString(),
                duration: formData.duration,
                mode: formData.mode,
                visitType: formData.visitType,
                meetingPoint: formData.meetingPoint || (project ? `${project.name} - Main Gate` : ''),
                notes: formData.notes,
                status: 'confirmed'
            };

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(booking)
            });

            if (res.ok) {
                onSuccess?.();
                onClose();
                // Reset form
                setFormData({
                    leadId: '',
                    projectId: '',
                    propertyId: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '10:00',
                    duration: 60,
                    mode: 'site_visit',
                    visitType: 'first_visit',
                    meetingPoint: '',
                    notes: ''
                });
            }
        } catch (error) {
            console.error('Error creating booking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Schedule Visit</h2>
                        <p className="text-sm text-slate-500 mt-1">Book a site visit for a lead</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Lead Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Select Lead *
                        </label>
                        <select
                            required
                            value={formData.leadId}
                            onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Choose a lead...</option>
                            {leads.map(lead => (
                                <option key={lead.id} value={lead.id}>
                                    {lead.firstName} {lead.lastName} - {lead.phone}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Project Selection */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Project
                        </label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value, propertyId: '' })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">No specific project</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>
                                    {project.name} - {project.location}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Property Selection */}
                    {formData.projectId && properties.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Property Unit
                            </label>
                            <select
                                value={formData.propertyId}
                                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="">No specific unit</option>
                                {properties.map(property => (
                                    <option key={property.id} value={property.id}>
                                        {property.unitNumber} - {property.type} ({property.area} sq ft)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Time *
                            </label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Duration (minutes)
                        </label>
                        <select
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={90}>1.5 hours</option>
                            <option value={120}>2 hours</option>
                        </select>
                    </div>

                    {/* Visit Type and Mode */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Visit Type
                            </label>
                            <select
                                value={formData.visitType}
                                onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="first_visit">First Visit</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="final_negotiation">Final Negotiation</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Mode
                            </label>
                            <select
                                value={formData.mode}
                                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="site_visit">Site Visit</option>
                                <option value="virtual_meeting">Virtual Meeting</option>
                                <option value="phone_call">Phone Call</option>
                            </select>
                        </div>
                    </div>

                    {/* Meeting Point */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Meeting Point
                        </label>
                        <input
                            type="text"
                            value={formData.meetingPoint}
                            onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                            placeholder="e.g., Project Main Gate, Office, etc."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="Any additional notes..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Scheduling...' : 'Schedule Visit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
