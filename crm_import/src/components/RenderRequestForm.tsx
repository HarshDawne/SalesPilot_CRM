'use client';

import { useState } from 'react';
import { RenderType } from '@/types/render';
import { Image as ImageIcon, Video, Send, Loader } from 'lucide-react';

interface RenderRequestFormProps {
    propertyId: string;
    propertyName: string;
    unitId?: string;
    unitNumber?: string;
    onRequestSubmitted?: () => void;
}

export default function RenderRequestForm({
    propertyId,
    propertyName,
    unitId,
    unitNumber,
    onRequestSubmitted
}: RenderRequestFormProps) {
    const [renderType, setRenderType] = useState<RenderType>('EXTERIOR');
    const [description, setDescription] = useState('');
    const [specifications, setSpecifications] = useState({
        viewAngle: '',
        timeOfDay: 'afternoon' as const,
        weather: 'sunny' as const,
        customRequirements: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/renders/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId,
                    unitId,
                    renderType,
                    description,
                    specifications,
                    requestedByName: 'Current User', // In production, get from auth
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSubmitted(true);
                setTimeout(() => {
                    if (onRequestSubmitted) onRequestSubmitted();
                }, 2000);
            }
        } catch (error) {
            console.error('Error submitting render request:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">Request Submitted!</h3>
                <p className="text-green-700 mb-4">
                    Your 3D render request has been received. Our team will start working on it shortly.
                </p>
                <p className="text-sm text-green-600">
                    You'll be notified when your render is ready.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Request 3D Render</h3>
                <p className="text-sm text-gray-600">
                    Request a custom 3D render for {propertyName}
                    {unitNumber && ` - Unit ${unitNumber}`}
                </p>
            </div>

            {/* Render Type */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Render Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { value: 'EXTERIOR', label: 'Exterior View', icon: ImageIcon },
                        { value: 'INTERIOR', label: 'Interior View', icon: ImageIcon },
                        { value: 'AERIAL', label: 'Aerial View', icon: ImageIcon },
                        { value: 'WALKTHROUGH', label: 'Walkthrough', icon: Video },
                        { value: 'CUSTOM', label: 'Custom', icon: ImageIcon },
                    ].map((type) => {
                        const Icon = type.icon;
                        return (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setRenderType(type.value as RenderType)}
                                className={`p-3 border-2 rounded-lg transition-all ${renderType === type.value
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5 mx-auto mb-1" />
                                <div className="text-xs font-medium">{type.label}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Description */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                </label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you'd like to see in the render..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Specifications */}
            <div className="mb-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Specifications (Optional)</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">View Angle</label>
                        <input
                            type="text"
                            value={specifications.viewAngle}
                            onChange={(e) => setSpecifications({ ...specifications, viewAngle: e.target.value })}
                            placeholder="e.g., Front elevation"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Time of Day</label>
                        <select
                            value={specifications.timeOfDay}
                            onChange={(e) => setSpecifications({ ...specifications, timeOfDay: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="night">Night</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Weather</label>
                        <select
                            value={specifications.weather}
                            onChange={(e) => setSpecifications({ ...specifications, weather: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="sunny">Sunny</option>
                            <option value="cloudy">Cloudy</option>
                            <option value="rainy">Rainy</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs text-gray-600 mb-1">Custom Requirements</label>
                    <textarea
                        value={specifications.customRequirements}
                        onChange={(e) => setSpecifications({ ...specifications, customRequirements: e.target.value })}
                        placeholder="Any specific requirements or preferences..."
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Our design team will review your request and start working on it.
                    Typical delivery time is 2-3 business days. You'll receive a notification when your render is ready.
                </p>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Submitting Request...
                    </>
                ) : (
                    <>
                        <Send className="w-5 h-5" />
                        Submit Request
                    </>
                )}
            </button>
        </form>
    );
}
