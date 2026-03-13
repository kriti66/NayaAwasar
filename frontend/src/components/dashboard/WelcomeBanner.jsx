import { Link } from 'react-router-dom';

const WelcomeBanner = ({ user, interviewCount }) => {
    return (
        <div className="bg-[#EEF4FF] rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
                    Welcome back, {user?.fullName?.split(' ')[0] || 'Member'}
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    You have <span className="text-[#29a08e] font-bold">{interviewCount} interview invitation{interviewCount !== 1 ? 's' : ''}</span> awaiting your action.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link to="/seeker/interviews" className="px-6 py-3 bg-[#29a08e] text-white rounded-xl font-bold shadow-lg shadow-[#29a08e]/20 hover:bg-[#228377] transition-all active:scale-95">
                        Respond to Interview
                    </Link>
                    <Link to="/seeker/search" className="px-6 py-3 bg-white text-[#29a08e] border border-[#29a08e]/20 rounded-xl font-bold hover:bg-[#29a08e]/5 transition-all active:scale-95">
                        Browse Career Matches
                    </Link>
                </div>
            </div>

            <div className="relative w-full md:w-[320px] h-[200px] shrink-0">
                <img
                    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800"
                    alt="Team collaboration"
                    className="w-full h-full object-cover rounded-2xl shadow-xl"
                />
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-[#29a08e]/20 rounded-full opacity-30"></div>
            <div className="absolute bottom-[-20px] right-20 w-32 h-32 bg-[#29a08e]/30 rounded-full opacity-20"></div>
        </div>
    );
};

export default WelcomeBanner;
