import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    UserCircle,
    Briefcase,
    Search,
    ChevronRight
} from 'lucide-react';

const SeekerSidebar = () => {
    const location = useLocation();

    // Navigation items
    const navItems = [
        { label: 'Dashboard', path: '/seeker/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Profile', path: '/seeker/profile', icon: <UserCircle size={20} /> },
        { label: 'Applications', path: '/seeker/applications', icon: <Briefcase size={20} /> },
        { label: 'Find Jobs', path: '/seeker/jobs', icon: <Search size={20} /> },
    ];

    return (
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-80px)] sticky top-20 z-40">
            <div className="flex-1 overflow-y-auto py-6 px-4">
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-[#29a08e]/10 text-[#29a08e]'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`${isActive ? 'text-[#29a08e]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                        {item.icon}
                                    </span>
                                    <span className="text-sm font-bold tracking-tight">{item.label}</span>
                                </div>
                                {isActive && <ChevronRight size={14} className="text-[#29a08e]" />}
                            </Link>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-gray-100">
                <div className="bg-emerald-50 rounded-2xl p-4">
                    <p className="text-[10px] font-black text-[#29a08e] uppercase tracking-widest mb-1">Pro Tip</p>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                        Complete your profile to get 3x more recruiters!
                    </p>
                </div>
            </div>
        </aside>
    );
};

export default SeekerSidebar;
