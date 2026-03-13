import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-9xl font-extrabold text-[#29a08e] tracking-widest">404</h1>
            <div className="bg-[#29a08e] text-white px-2 text-sm rounded rotate-12 absolute">
                Page Not Found
            </div>
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Whoops! You're lost.
                </h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                    The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <Link
                    to="/"
                    className="inline-block px-8 py-3 bg-[#29a08e] text-white rounded-lg font-bold hover:bg-[#228377] transition-colors shadow-sm"
                >
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
