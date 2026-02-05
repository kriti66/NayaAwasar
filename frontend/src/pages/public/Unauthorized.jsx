import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                <div className="mb-6 inline-flex items-center justify-center p-4 bg-red-100 rounded-full">
                    <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Access Denied
                </h1>

                <p className="text-gray-600 mb-8">
                    You don't have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>

                <div className="space-y-3">
                    <Link
                        to="/"
                        className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Back to Home
                    </Link>
                    <Link
                        to="/contact"
                        className="block w-full px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
