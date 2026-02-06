import DashboardNavbar from '../dashboard/DashboardNavbar';
import GlobalFooter from '../GlobalFooter';
import { Outlet } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-100 font-sans text-gray-900">
            <DashboardNavbar />
            <div className="flex-1 flex flex-col w-full">
                {children || <Outlet />}
            </div>
            <GlobalFooter />
        </div>
    );
};

export default AdminLayout;
