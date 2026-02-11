import { Outlet } from 'react-router-dom';

const KycLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {/* Minimal Header / Branding if desired, or keep it totally clean */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Naya <span className="text-blue-600">Awasar</span></h1>
            </div>

            <div className="w-full max-w-5xl">
                {children || <Outlet />}
            </div>
        </div>
    );
};

export default KycLayout;
