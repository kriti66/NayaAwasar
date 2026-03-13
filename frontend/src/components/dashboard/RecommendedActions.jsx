import { Link } from 'react-router-dom';

const RecommendedActions = ({ actions }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'kyc': return '🆔';
            case 'profile': return '📄';
            case 'interview': return '📅';
            case 'skills': return '🛠️';
            default: return '✨';
        }
    };

    const getLink = (type) => {
        switch (type) {
            case 'kyc': return '/kyc';
            case 'profile': return '/seeker/profile';
            case 'interview': return '/seeker/interviews';
            default: return '/seeker/profile';
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full">
            <h3 className="text-lg font-bold text-gray-900 mb-8">Recommended Actions</h3>

            <div className="space-y-4">
                {actions.length > 0 ? actions.map((action) => (
                    <Link
                        key={action.id}
                        to={getLink(action.type)}
                        className="flex items-center gap-4 p-4 border border-gray-50 rounded-2xl hover:border-[#29a08e]/20 hover:bg-[#29a08e]/5 transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${action.urgency === 'high' ? 'bg-red-50 text-red-500' : 'bg-[#29a08e]/10 text-[#29a08e]'}`}>
                            {action.urgency === 'high' ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-0.5">{action.title}</h4>
                            <p className="text-xs text-gray-400 font-medium">
                                {action.urgency === 'high' ? 'Priority action required' : 'Improve your discoverability'}
                            </p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 group-hover:text-[#29a08e] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                )) : (
                    <div className="text-center py-10">
                        <div className="text-4xl mb-4">🏆</div>
                        <p className="text-sm font-bold text-gray-900">You're all caught up!</p>
                        <p className="text-xs text-gray-400 mt-1">Keep applying to stay visible to recruiters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecommendedActions;
