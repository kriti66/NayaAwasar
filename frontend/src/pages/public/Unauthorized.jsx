import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0d2f2b] to-slate-900 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-20 left-20 w-80 h-80 bg-red-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-64 h-64 bg-[#29a08e] rounded-full blur-3xl"></div>
            </div>
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}></div>

            <div className="relative z-10 max-w-md mx-auto">
                <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                </div>

                <h1 className="text-4xl font-black text-white mb-3">Access Denied</h1>
                <p className="text-gray-400 mb-10 leading-relaxed">
                    You don't have permission to access this page. If you believe this is an error, please contact support.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="px-8 py-3.5 bg-[#29a08e] text-white rounded-2xl font-bold hover:bg-[#228377] transition-all shadow-2xl shadow-[#29a08e]/30"
                    >
                        ← Back to Home
                    </Link>
                    <Link
                        to="/contact"
                        className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
