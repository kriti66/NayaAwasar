import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';

const AdminLocationManager = () => {
    const [formData, setFormData] = useState({
        address: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const res = await api.get('/location');
                if (res.data) {
                    setFormData(res.data);
                }
            } catch (error) {
                console.error("Error fetching location:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            await api.put('/location', formData);
            setMessage({ type: 'success', text: 'Location updated successfully!' });
        } catch (error) {
            console.error("Error updating location:", error);
            setMessage({ type: 'error', text: 'Failed to update location.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <DashboardNavbar />
            <div className="flex-1 w-full">
                <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Office Location
                        </h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div className="border-b border-gray-100 pb-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Location Settings</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure your office address and contact information</p>
                            </div>

                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <p className="text-xs text-gray-400 font-medium">Loading details...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {message.text && (
                                        <div className={`p-4 rounded-lg text-sm font-semibold border ${message.type === 'success'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            {message.text}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Physical Address</label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                name="latitude"
                                                value={formData.latitude}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Longitude</label>
                                            <input
                                                type="number"
                                                step="any"
                                                name="longitude"
                                                value={formData.longitude}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            {saving ? 'Updating...' : 'Save Location'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLocationManager;
