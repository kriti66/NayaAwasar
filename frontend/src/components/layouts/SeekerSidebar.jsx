import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle,
    Briefcase,
    Search,
    ChevronRight,
    Calendar,
    Sparkles
} from 'lucide-react';

const SeekerSidebar = () => {
    const location = useLocation();

    // Navigation items
    const navItems = [
        { label: 'Dashboard', path: '/seeker/dashboard', icon: LayoutDashboard, description: 'Overview & stats' },
        { label: 'Profile', path: '/seeker/profile', icon: UserCircle, description: 'Manage your profile' },
        { label: 'Applications', path: '/seeker/applications', icon: Briefcase, description: 'Track applications' },
        { label: 'Find Jobs', path: '/seeker/jobs', icon: Search, description: 'Browse opportunities' },
        { label: 'Interviews', path: '/seeker/interviews', icon: Calendar, description: 'Upcoming interviews' },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-[calc(100vh-80px)] sticky top-20 z-40">
            <div className="flex-1 overflow-y-auto py-6 px-3">
                {/* User mini-info */}
                <div className="px-4 mb-6">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Navigation</p>
                </div>

                <div className="space-y-0.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path !== '/seeker/dashboard' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                    ? 'bg-[#29a08e]/10 text-[#29a08e]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#29a08e] rounded-r-full"></div>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className={`${isActive ? 'text-[#29a08e]' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}>
                                        <item.icon size={20} />
                                    </span>
                                    <div>
                                        <span className="text-sm font-bold tracking-tight block leading-tight">{item.label}</span>
                                        <span className="text-[10px] text-gray-400 font-medium leading-tight">{item.description}</span>
                                    </div>
                                </div>
                                {isActive && <ChevronRight size={14} className="text-[#29a08e]" />}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="p-3">
                <div className="bg-gradient-to-br from-[#29a08e]/10 to-emerald-50 rounded-2xl p-5 border border-[#29a08e]/10">
                    <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#29a08e] flex items-center justify-center">
                            <Sparkles size={14} className="text-white" />
                        </div>
                        <p className="text-xs font-bold text-gray-900">Pro Tip</p>
                    </div>
                    <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Complete your profile to get 3x more recruiter views!
                    </p>
                    <Link
                        to="/seeker/profile"
                        className="mt-3 flex items-center gap-1 text-[10px] font-bold text-[#29a08e] hover:underline"
                    >
                        Update Profile <ChevronRight size={10} />
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default SeekerSidebar;
