import DashboardNavbar from '../dashboard/DashboardNavbar';
import GlobalFooter from '../GlobalFooter';

const RecruiterLayout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-[#F3F4F6] font-sans text-gray-900">
            <DashboardNavbar />
            <div className="flex-1 flex flex-col w-full">
                {children}
            </div>
            <GlobalFooter />
        </div>
    );
};

export default RecruiterLayout;
