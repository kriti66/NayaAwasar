import AdminSidebar from '../layouts/AdminSidebar';
import AdminTopbar from '../layouts/AdminTopbar';
import { Outlet } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar />

                <main className="flex-1 overflow-y-auto">
                    {children || <Outlet />}
                </main>

                <footer className="border-t border-slate-200 bg-white px-6 py-2.5 flex items-center justify-between text-xs text-slate-500">
                    <span>&copy; {new Date().getFullYear()} Naya Awasar</span>
                    <span>Admin Panel</span>
                </footer>
            </div>
        </div>
    );
};

export default AdminLayout;
