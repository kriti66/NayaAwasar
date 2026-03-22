import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Building2,
    Briefcase,
    Megaphone,
    CreditCard,
    ShieldCheck,
    MessageSquare,
    MapPin,
    ChevronRight,
    ChevronLeft
} from 'lucide-react';

const SECTIONS = {
    main: {
        label: null,
        items: [
            { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard }
        ]
    },
    management: {
        label: 'Management',
        items: [
            { label: 'Users', path: '/admin/users', icon: Users },
            { label: 'Companies', path: '/admin/companies', icon: Building2 },
            { label: 'Jobs', path: '/admin/jobs', icon: Briefcase }
        ]
    },
    moderation: {
        label: 'Moderation',
        items: [
            { label: 'KYC Panel', path: '/admin/kyc', icon: ShieldCheck },
            { label: 'Promoted Jobs', path: '/admin/promoted-jobs', icon: Megaphone },
            { label: 'Promotion Requests', path: '/admin/promotion-requests', icon: CreditCard }
        ]
    },
    system: {
        label: 'System',
        items: [
            { label: 'Location', path: '/admin/location', icon: MapPin },
            { label: 'Contact Messages', path: '/admin/contact-messages', icon: MessageSquare }
        ]
    }
};

const AdminSidebar = () => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (path) => {
        if (path === '/admin/dashboard') return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    return (
        <aside
            className={`hidden lg:flex flex-col bg-white border-r border-slate-200 h-screen sticky top-0 z-40 transition-all duration-200 ${collapsed ? 'w-[56px]' : 'w-56'}`}
        >
            {/* Logo */}
            <div className={`flex items-center h-14 border-b border-slate-100 px-3 shrink-0 ${collapsed ? 'justify-center' : 'gap-2'}`}>
                <div className="h-8 w-8 rounded-lg bg-[#29a08e] flex items-center justify-center shrink-0">
                    <Briefcase size={16} className="text-white" />
                </div>
                {!collapsed && (
                    <span className="text-sm font-semibold text-slate-900 truncate">
                        Naya Awasar
                    </span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2">
                {Object.entries(SECTIONS).map(([key, section]) => (
                    <div key={key} className="mb-4">
                        {!collapsed && section.label && (
                            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                {section.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {section.items.map((item) => {
                                const active = isActive(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        title={collapsed ? item.label : undefined}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${active
                                            ? 'bg-slate-100 text-slate-900'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        <item.icon size={18} className="shrink-0 text-slate-500" />
                                        {!collapsed && <span className="truncate">{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Collapse */}
            <div className="shrink-0 border-t border-slate-100 p-2">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-700 text-xs font-medium transition-colors"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Collapse</span></>}
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
