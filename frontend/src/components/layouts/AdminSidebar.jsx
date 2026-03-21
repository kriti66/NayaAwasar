import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    Megaphone,
    ShieldCheck,
    MessageSquare,
    MapPin,
    ChevronRight,
    ChevronLeft,
    Zap
} from 'lucide-react';

const adminNavItems = [
    {
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'Overview & analytics'
    },
    {
        label: 'Manage Users',
        path: '/admin/users',
        icon: Users,
        description: 'User accounts'
    },
    {
        label: 'Manage Companies',
        path: '/admin/companies',
        icon: Building2,
        description: 'Company profiles'
    },
    {
        label: 'Manage Jobs',
        path: '/admin/jobs',
        icon: Briefcase,
        description: 'Job listings'
    },
    {
        label: 'Promoted Jobs',
        path: '/admin/promoted-jobs',
        icon: Megaphone,
        description: 'Ad campaigns'
    },
    {
        label: 'KYC Panel',
        path: '/admin/kyc',
        icon: ShieldCheck,
        description: 'Verification requests'
    },
    {
        label: 'Contact Messages',
        path: '/admin/contact-messages',
        icon: MessageSquare,
        description: 'User messages'
    },
    {
        label: 'Manage Location',
        path: '/admin/location',
        icon: MapPin,
        description: 'Districts & cities'
    },
];

const AdminSidebar = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={`hidden lg:flex flex-col bg-gray-900 border-r border-gray-800 h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out ${collapsed ? 'w-[72px]' : 'w-64'}`}
        >
            {/* Logo area */}
            <div className={`flex items-center h-16 border-b border-gray-800 px-4 shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <div className="bg-[#29a08e] text-white p-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-[#29a08e]/20 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                {!collapsed && (
                    <span className="text-base font-bold text-white tracking-tight whitespace-nowrap">
                        Naya <span className="text-[#29a08e]">Awasar</span>
                    </span>
                )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 custom-scrollbar">
                {!collapsed && (
                    <p className="px-3 mb-3 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                        Admin Panel
                    </p>
                )}

                {adminNavItems.map((item) => {
                    const isActive =
                        location.pathname === item.path ||
                        (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            title={collapsed ? item.label : undefined}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${isActive
                                ? 'bg-[#29a08e]/15 text-[#29a08e]'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                } ${collapsed ? 'justify-center' : ''}`}
                        >
                            {/* Active indicator bar */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#29a08e] rounded-r-full" />
                            )}

                            {/* Icon */}
                            <span className={`shrink-0 transition-colors ${isActive ? 'text-[#29a08e]' : 'text-gray-500 group-hover:text-white'}`}>
                                <item.icon size={19} />
                            </span>

                            {/* Label & description */}
                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold block leading-tight tracking-tight">
                                        {item.label}
                                    </span>
                                    <span className="text-[10px] text-gray-600 font-medium leading-tight group-hover:text-gray-400 transition-colors">
                                        {item.description}
                                    </span>
                                </div>
                            )}

                            {/* Active chevron */}
                            {!collapsed && isActive && (
                                <ChevronRight size={14} className="text-[#29a08e] shrink-0" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle + bottom badge */}
            <div className="shrink-0 border-t border-gray-800 p-3 space-y-3">
                {!collapsed && (
                    <div className="bg-gradient-to-br from-[#29a08e]/10 to-emerald-900/20 rounded-xl p-3 border border-[#29a08e]/10">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-6 h-6 rounded-lg bg-[#29a08e] flex items-center justify-center">
                                <Zap size={12} className="text-white" />
                            </div>
                            <p className="text-[11px] font-bold text-white">Admin Portal</p>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                            Full control over the platform.
                        </p>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center py-2 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800 transition-all text-xs font-semibold gap-1.5"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
