import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import {
    Quote,
    Search,
    Plus,
    Pencil,
    Trash2,
    RefreshCw,
    X,
    Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const emptyForm = {
    name: '',
    role: '',
    review: '',
    rating: 5,
    isActive: true
};

const ManageTestimonials = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);
    const blobUrlRef = useRef(null);

    const revokeBlob = () => {
        if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
        }
    };

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/testimonials/admin/all');
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to load testimonials.');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        return () => revokeBlob();
    }, []);

    const openCreate = () => {
        revokeBlob();
        setEditingId(null);
        setForm(emptyForm);
        setPhotoFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const openEdit = (t) => {
        revokeBlob();
        setEditingId(t._id);
        setForm({
            name: t.name || '',
            role: t.role || '',
            review: t.review || '',
            rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
            isActive: t.isActive !== false
        });
        setPhotoFile(null);
        setPreviewUrl(t.photo || '');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        revokeBlob();
        setPhotoFile(null);
        setPreviewUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onPhotoChange = (e) => {
        const file = e.target.files?.[0];
        revokeBlob();
        setPhotoFile(file || null);
        if (file) {
            const url = URL.createObjectURL(file);
            blobUrlRef.current = url;
            setPreviewUrl(url);
        } else if (editingId) {
            const t = rows.find((r) => r._id === editingId);
            setPreviewUrl(t?.photo || '');
        } else {
            setPreviewUrl('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const name = form.name.trim();
        const review = form.review.trim();
        if (!name || !review) {
            toast.error('Name and review are required.');
            return;
        }
        if (!editingId && !photoFile) {
            toast.error('Please choose a photo for new testimonials.');
            return;
        }

        const fd = new FormData();
        fd.append('name', name);
        fd.append('role', form.role.trim());
        fd.append('review', review);
        fd.append('rating', String(form.rating));
        fd.append('isActive', form.isActive ? 'true' : 'false');
        if (photoFile) fd.append('photo', photoFile);

        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/testimonials/${editingId}`, fd);
                toast.success('Testimonial updated.');
            } else {
                await api.post('/testimonials', fd);
                toast.success('Testimonial created.');
            }
            closeModal();
            await fetchAll();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (t) => {
        if (!window.confirm(`Delete testimonial from ${t.name}?`)) return;
        try {
            await api.delete(`/testimonials/${t._id}`);
            toast.success('Testimonial deleted.');
            setRows((prev) => prev.filter((r) => r._id !== t._id));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.');
        }
    };

    const filtered = rows.filter(
        (t) =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.review?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderStars = (n) => {
        const r = Math.min(5, Math.max(1, Number(n) || 5));
        return (
            <span className="inline-flex gap-0.5 text-amber-400">
                {Array.from({ length: r }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
                ))}
                {Array.from({ length: 5 - r }).map((_, i) => (
                    <Star key={`e-${i}`} className="w-3.5 h-3.5 text-gray-200" strokeWidth={1.5} />
                ))}
            </span>
        );
    };

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
                        backgroundSize: '32px 32px'
                    }}
                />
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#29a08e]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-[#29a08e]/20 rounded-xl flex items-center justify-center border border-[#29a08e]/30">
                                    <Quote className="h-5 w-5 text-[#5eead4]" />
                                </div>
                                <span className="text-[11px] font-bold text-[#5eead4] uppercase tracking-[0.2em]">
                                    Content
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Testimonials</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">
                                Manage landing page success stories and photos (Cloudinary).
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() => fetchAll()}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-colors"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#29a08e] text-white text-sm font-bold hover:bg-[#228377] transition-colors shadow-lg shadow-[#29a08e]/25"
                            >
                                <Plus className="w-4 h-4" />
                                Add testimonial
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[480px] flex flex-col">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search name, role, or review…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">
                            {filtered.length} testimonial{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3">
                                <div className="w-10 h-10 border-2 border-[#29a08e]/30 border-t-[#29a08e] rounded-full animate-spin" />
                                <p className="text-sm text-gray-500 font-medium">Loading…</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                        <th className="px-5 py-3 w-16">Photo</th>
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">Role</th>
                                        <th className="px-5 py-3">Rating</th>
                                        <th className="px-5 py-3">Active</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filtered.map((t) => (
                                        <tr key={t._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-5 py-3">
                                                {t.photo ? (
                                                    <img
                                                        src={t.photo}
                                                        alt=""
                                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#29a08e] to-[#228377] text-white text-xs font-bold flex items-center justify-center border border-[#29a08e]/20">
                                                        {(t.name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 font-semibold text-gray-900">{t.name}</td>
                                            <td className="px-5 py-3 text-gray-600 max-w-[200px] truncate" title={t.role}>
                                                {t.role || '—'}
                                            </td>
                                            <td className="px-5 py-3">{renderStars(t.rating)}</td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                                        t.isActive !== false
                                                            ? 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20'
                                                            : 'bg-gray-100 text-gray-500 border-gray-200'
                                                    }`}
                                                >
                                                    {t.isActive !== false ? 'Active' : 'Hidden'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <div className="inline-flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(t)}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-[#29a08e]/10 hover:text-[#29a08e] transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(t)}
                                                        className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!loading && filtered.length === 0 && (
                            <div className="text-center py-16 text-gray-500 text-sm font-medium">
                                No testimonials yet. Click &ldquo;Add testimonial&rdquo; to create one.
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div
                        className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg max-h-[min(90vh,720px)] overflow-y-auto"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                            <h2 className="text-lg font-black text-gray-900">
                                {editingId ? 'Edit testimonial' : 'New testimonial'}
                            </h2>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Role
                                </label>
                                <input
                                    type="text"
                                    value={form.role}
                                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none"
                                    placeholder="e.g. Software Engineer at Acme"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Review <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={form.review}
                                    onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none resize-y"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Rating (1–5)
                                </label>
                                <select
                                    value={form.rating}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, rating: Number(e.target.value) }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none bg-white"
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n}>
                                            {n} star{n > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                    className="w-4 h-4 rounded border-gray-300 text-[#29a08e] focus:ring-[#29a08e]"
                                />
                                <span className="text-sm font-semibold text-gray-700">Show on website (active)</span>
                            </label>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Photo {!editingId && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,image/webp"
                                    onChange={onPhotoChange}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#29a08e]/10 file:text-[#29a08e] hover:file:bg-[#29a08e]/20"
                                />
                                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or WebP. Max 5 MB.</p>
                                {previewUrl && (
                                    <div className="mt-3 flex justify-center">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-24 h-24 rounded-full object-cover border-2 border-[#29a08e]/20"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 rounded-xl bg-[#29a08e] text-white text-sm font-bold hover:bg-[#228377] disabled:opacity-60"
                                >
                                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTestimonials;
