import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

const ApplicationFilters = ({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, sortBy, setSortBy, count }) => {
    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#29a08e] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by job title or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-[#29a08e] focus:ring-4 focus:ring-[#29a08e]/10 outline-none transition-all shadow-sm"
                    />
                </div>

                <div className="flex gap-3">
                    <div className="relative group">
                        <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#29a08e] transition-all cursor-pointer shadow-sm"
                        >
                            <option value="All">All Applications</option>
                            <option value="Applied">Applied</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer Extended">Offer Extended</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>

                    <div className="relative group">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#29a08e] transition-all cursor-pointer shadow-sm"
                        >
                            <option value="Newest">Most Recent</option>
                            <option value="Oldest">Oldest</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                Showing {count} application{count !== 1 ? 's' : ''}
            </p>
        </div>
    );
};

export default ApplicationFilters;
