import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-80 h-80 bg-[#29a08e] rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-teal-400 rounded-full blur-3xl"></div>
            </div>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>

            <div className="relative z-10 max-w-lg mx-auto">
                {/* 404 Number */}
                <div className="relative inline-block mb-6">
                    <h1 className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#29a08e] to-[#29a08e]/20 leading-none tracking-tighter select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>🔍</span>
                    </div>
                </div>

                <h2 className="text-3xl font-black text-white mb-3">Page Not Found</h2>
                <p className="text-gray-400 mb-10 leading-relaxed">
                    Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="px-8 py-3.5 bg-[#29a08e] text-white rounded-2xl font-bold hover:bg-[#228377] transition-all shadow-2xl shadow-[#29a08e]/30 hover:shadow-[#29a08e]/50"
                    >
                        ← Back to Home
                    </Link>
                    <Link
                        to="/jobs"
                        className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all"
                    >
                        Browse Jobs
                    </Link>
                </div>

                <div className="mt-12 flex items-center justify-center gap-6">
                    <Link to="/about" className="text-gray-400 hover:text-[#29a08e] text-sm transition-colors">About</Link>
                    <span className="text-gray-700">•</span>
                    <Link to="/contact" className="text-gray-400 hover:text-[#29a08e] text-sm transition-colors">Contact</Link>
                    <span className="text-gray-700">•</span>
                    <Link to="/login" className="text-gray-400 hover:text-[#29a08e] text-sm transition-colors">Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
