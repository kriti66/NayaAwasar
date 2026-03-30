import { Lock } from 'lucide-react';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

const RecruiterChangePassword = () => {
    return (
        <main className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-[#0a9e8f]/10 to-teal-50">
                    <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
                        <Lock size={18} className="text-[#0a9e8f]" />
                        Change Password
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Update your password regularly to keep your recruiter account safe.
                    </p>
                </div>
                <div className="p-6">
                    <ChangePasswordForm />
                </div>
            </div>
        </main>
    );
};

export default RecruiterChangePassword;
