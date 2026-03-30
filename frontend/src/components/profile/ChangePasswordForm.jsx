import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const strengthLevels = [
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-teal-500' },
    { label: 'Strong', color: 'bg-emerald-600' }
];

const scorePassword = (value) => {
    let score = 0;
    if ((value || '').length >= 8) score++;
    if (/[A-Z]/.test(value || '') && /[a-z]/.test(value || '')) score++;
    if (/\d/.test(value || '')) score++;
    if (/[^A-Za-z0-9]/.test(value || '')) score++;
    return Math.max(0, Math.min(4, score));
};

const ChangePasswordForm = ({ onSuccess }) => {
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const strengthScore = useMemo(() => scorePassword(formData.newPassword), [formData.newPassword]);
    const strength = strengthLevels[Math.max(0, strengthScore - 1)] || strengthLevels[0];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const toggleShow = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentPassword = formData.currentPassword.trim();
        const newPassword = formData.newPassword;
        const confirmPassword = formData.confirmPassword;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required.');
            return;
        }
        if (currentPassword === newPassword) {
            setError('New password cannot be same as old password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            const res = await api.put('/users/change-password', { currentPassword, newPassword });
            toast.success(res?.data?.message || 'Password changed!');
            setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            if (onSuccess) onSuccess();
        } catch (err) {
            const msg = err?.response?.data?.message || 'Failed to change password';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{error}</div>}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                <div className="relative">
                    <input
                        type={showPassword.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a9e8f]/30 focus:border-[#0a9e8f]"
                        placeholder="Enter old password"
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
                        type={showPassword.new ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a9e8f]/30 focus:border-[#0a9e8f]"
                        placeholder="Enter new password"
                    />
                    <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-2.5 text-gray-400">
                        {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                <div className="mt-2">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${strength.color} transition-all`}
                            style={{ width: `${Math.max(10, strengthScore * 25)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Strength: {strength.label}</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                    <input
                        type={showPassword.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a9e8f]/30 focus:border-[#0a9e8f]"
                        placeholder="Confirm new password"
                    />
                    <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-2.5 text-gray-400">
                        {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 bg-[#0a9e8f] text-white font-semibold hover:bg-[#088579] disabled:opacity-60"
            >
                <Lock size={16} />
                {loading ? 'Updating...' : 'Change Password'}
            </button>
        </form>
    );
};

export default ChangePasswordForm;
