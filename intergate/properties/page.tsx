'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, Home, Key, TrendingUp, Search, Plus } from 'lucide-react';
import { usePropertyStore } from './store';

type FilterType = 'All' | 'Active' | 'Under Construction' | 'Completed';

export default function PropertiesPage() {
    const projects = usePropertyStore((state) => state.projects);
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Client-side filtering and search
    const filteredProjects = useMemo(() => {
        let filtered = projects;

        // Apply status filter
        if (activeFilter !== 'All') {
            filtered = filtered.filter((p) => p.status === activeFilter);
        }

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.location.toLowerCase().includes(query) ||
                    p.city.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [projects, activeFilter, searchQuery]);

    // Calculate metrics
    const metrics = useMemo(() => {
        return {
            totalProjects: projects.length,
            totalTowers: projects.reduce((sum, p) => sum + p.totalTowers, 0),
            totalUnits: projects.reduce((sum, p) => sum + p.totalUnits, 0),
            availableUnits: projects.reduce((sum, p) => sum + p.availableUnits, 0),
        };
    }, [projects]);

    const filters: FilterType[] = ['All', 'Active', 'Under Construction', 'Completed'];

    return (
        <div className="min-h-screen bg-white">
            {/* Page Header */}
            <div className="border-b border-gray-200 bg-white px-4 py-6 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl font-outfit">
                            Property Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 font-inter">
                            Manage and track your real estate projects
                        </p>
                    </div>
                    <button
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-700 hover:shadow-md active:scale-95"
                        aria-label="Add new project"
                    >
                        <Plus className="h-5 w-5" />
                        <span>Add New Project</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 py-6 sm:px-8 sm:py-8">
                {/* Metrics Cards */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
                    {/* Total Projects */}
                    <div className="rounded-2xl bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                                <Building2 className="h-6 w-6 text-primary-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 font-inter">Total Projects</p>
                                <p className="text-2xl font-bold text-gray-900 font-outfit">{metrics.totalProjects}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Towers */}
                    <div className="rounded-2xl bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-orange-100">
                                <Home className="h-6 w-6 text-orange-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 font-inter">Total Towers</p>
                                <p className="text-2xl font-bold text-gray-900 font-outfit">{metrics.totalTowers}</p>
                            </div>
                        </div>
                    </div>

                    {/* Total Units */}
                    <div className="rounded-2xl bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100">
                                <Key className="h-6 w-6 text-purple-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 font-inter">Total Units</p>
                                <p className="text-2xl font-bold text-gray-900 font-outfit">{metrics.totalUnits}</p>
                            </div>
                        </div>
                    </div>

                    {/* Available Units */}
                    <div className="rounded-2xl bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-100">
                                <TrendingUp className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600 font-inter">Available Units</p>
                                <p className="text-2xl font-bold text-gray-900 font-outfit">{metrics.availableUnits}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Projects Section */}
                <div className="rounded-2xl bg-white p-4 shadow-card sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900 font-outfit">Projects</h2>
                    </div>

                    {/* Search and Filters */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm font-inter transition-colors duration-300 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
                                aria-label="Search projects by name or location"
                            />
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0" role="group" aria-label="Project filters">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${activeFilter === filter
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    aria-pressed={activeFilter === filter}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project Cards Grid */}
                    {filteredProjects.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project) => (
                                <Link key={project.id} href={`/properties/${project.id}`}>
                                    <div className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                                        <div className={`aspect-video w-full bg-gradient-to-br ${project.imageGradient}`}></div>
                                        <div className="p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 font-outfit">{project.name}</h3>
                                            <p className="mt-1 text-sm text-gray-600 font-inter">{project.location}</p>
                                            <div className="mt-4 flex items-center gap-2">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${project.status === 'Active'
                                                            ? 'bg-green-100 text-green-700'
                                                            : project.status === 'Under Construction'
                                                                ? 'bg-orange-100 text-orange-700'
                                                                : 'bg-indigo-100 text-indigo-700'
                                                        }`}
                                                >
                                                    {project.status}
                                                </span>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 font-inter">
                                                <span className="flex items-center gap-1">
                                                    <Building2 className="h-4 w-4" aria-hidden="true" />
                                                    {project.totalTowers} Towers
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Home className="h-4 w-4" aria-hidden="true" />
                                                    {project.totalUnits} Units
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Key className="h-4 w-4" aria-hidden="true" />
                                                    {project.availableUnits} Available
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <Building2 className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 font-outfit">No projects found</h3>
                            <p className="mb-6 text-sm text-gray-600 font-inter">
                                {searchQuery
                                    ? 'Try adjusting your search or filter'
                                    : 'Get started by creating your first project'}
                            </p>
                            <button className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-primary-700 hover:shadow-md active:scale-95">
                                <Plus className="h-5 w-5" />
                                Add New Project
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* TODO: Backend Integration Points
        - Replace usePropertyStore with API calls to /api/properties
        - Add mutation hooks for CRUD operations
        - Implement server-side search and filtering
        - Add pagination for large datasets
      */}
        </div>
    );
}
