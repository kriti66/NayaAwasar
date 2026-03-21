import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    MapPin,
    Phone,
    Mail,
    Globe,
    Navigation,
    CheckCircle2,
    AlertCircle,
    Save
} from 'lucide-react';

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
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 bg-orange-500/20 rounded-xl flex items-center justify-center border border-orange-500/30">
                                <MapPin className="h-5 w-5 text-orange-400" />
                            </div>
                            <span className="text-[11px] font-bold text-orange-400 uppercase tracking-[0.2em]">Location Settings</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Office Location</h1>
                        <p className="text-gray-400 mt-1.5 font-medium text-sm">Configure your office address and contact information for the platform.</p>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-8">
                        {/* Section Header */}
                        <div className="border-b border-gray-100 pb-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                    <div className="h-7 w-7 bg-[#29a08e]/10 rounded-lg flex items-center justify-center">
                                        <Navigation className="w-3.5 h-3.5 text-[#29a08e]" />
                                    </div>
                                    Location Details
                                </h3>
                                <p className="text-xs text-gray-400 mt-1.5 ml-9">Update the address and contact details shown on your website.</p>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                <div className="w-10 h-10 border-[3px] border-[#29a08e]/20 border-t-[#29a08e] rounded-full animate-spin"></div>
                                <p className="text-xs text-gray-400 font-medium">Loading details...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {message.text && (
                                    <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold border ${message.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                        {message.type === 'success' 
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 
                                            : <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                        }
                                        {message.text}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Address - Full Width */}
                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-[#29a08e]" />
                                            Physical Address
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all outline-none"
                                            placeholder="Enter full address"
                                        />
                                    </div>

                                    {/* Coordinates */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all outline-none"
                                            placeholder="e.g., 27.7172"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all outline-none"
                                            placeholder="e.g., 85.3240"
                                        />
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Phone className="w-3.5 h-3.5 text-purple-500" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all outline-none"
                                            placeholder="e.g., +977 9801234567"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-purple-500" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] transition-all outline-none"
                                            placeholder="e.g., contact@nayaawasar.com"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-3.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? 'Updating...' : 'Save Location'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLocationManager;
