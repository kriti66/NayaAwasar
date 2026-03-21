import AdminSidebar from '../layouts/AdminSidebar';
import AdminTopbar from '../layouts/AdminTopbar';
import { Outlet } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-gray-950 font-sans text-gray-100">
            {/* Left sidebar – desktop only */}
            <AdminSidebar />

            {/* Right: topbar + main content */}
            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar />

                <main className="flex-1 overflow-y-auto bg-[#0f172a]">
                    {children || <Outlet />}
                </main>

                {/* Minimal admin footer */}
                <footer className="bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center justify-between text-[11px] text-gray-600 font-medium">
                    <span>&copy; {new Date().getFullYear()} Naya Awasar — Admin Panel</span>
                    <span>v1.0.0</span>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
