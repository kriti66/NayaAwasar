
import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const toggleShow = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords don't match");
            return;
        }

        if (formData.newPassword.length < 8) {
            setError("New password must be at least 8 characters long");
            return;
        }

        try {
            setLoading(true);
            // Updated endpoint to match backend route PUT /api/users/change-password
            const res = await api.put('/users/change-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });

            setSuccess(res.data.message || 'Password updated successfully');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);

        } catch (err) {
            console.error("Change password frontend error:", err);
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center gap-2">
                                <Lock size={20} className="text-[#29a08e]" />
                                Change Password
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X size={24} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                <span>⚠️</span>
                                <div>{error}</div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-start gap-2">
                                <span>✅</span>
                                <div>{success}</div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.current ? "text" : "password"}
                                        name="currentPassword"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#29a08e]"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-2.5 text-gray-400">
                                        {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.new ? "text" : "password"}
                                        name="newPassword"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#29a08e]"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-2.5 text-gray-400">
                                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword.confirm ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                        className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#29a08e]"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-2.5 text-gray-400">
                                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] sm:text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-[#29a08e] text-base font-medium text-white hover:bg-[#228377] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#29a08e] sm:text-sm disabled:opacity-70"
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
