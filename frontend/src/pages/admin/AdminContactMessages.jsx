import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    MessageSquare,
    Search,
    Mail,
    MailOpen,
    Reply,
    CheckCircle2,
    Clock,
    Eye,
    X,
    Send,
    RefreshCw,
    AlertCircle,
    User,
    Calendar,
    Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AdminContactMessages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // View modal state
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Reply modal state
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
            const res = await api.get('/contact', { params });
            setMessages(res.data);
        } catch (err) {
            console.error('Error fetching contact messages:', err);
            toast.error('Failed to load contact messages.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [statusFilter]);

    // Mark as READ when viewing
    const handleView = async (msg) => {
        setSelectedMessage(msg);
        setShowViewModal(true);

        if (msg.status === 'NEW') {
            try {
                await api.patch(`/contact/${msg._id}/status`, { status: 'READ' });
                setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: 'READ' } : m));
                setSelectedMessage(prev => ({ ...prev, status: 'READ' }));
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
    };

    const handleReplyClick = (msg) => {
        setSelectedMessage(msg);
        setReplyText('');
        setShowReplyModal(true);
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) {
            toast.error('Reply message cannot be empty.');
            return;
        }
        setReplying(true);
        try {
            const res = await api.post(`/contact/${selectedMessage._id}/reply`, { reply: replyText });
            toast.success('Reply sent successfully!');
            setMessages(prev => prev.map(m => m._id === selectedMessage._id ? res.data.contact : m));
            setShowReplyModal(false);
            setReplyText('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send reply.');
        } finally {
            setReplying(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await api.patch(`/contact/${id}/status`, { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            setMessages(prev => prev.map(m => m._id === id ? { ...m, status: newStatus } : m));
            if (selectedMessage?._id === id) {
                setSelectedMessage(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            toast.error('Failed to update status.');
        }
    };

    const filteredMessages = messages.filter(msg =>
        msg.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusCounts = {
        NEW: messages.filter(m => m.status === 'NEW').length,
        READ: messages.filter(m => m.status === 'READ').length,
        REPLIED: messages.filter(m => m.status === 'REPLIED').length,
        RESOLVED: messages.filter(m => m.status === 'RESOLVED').length,
    };

    const getStatusBadge = (status) => {
        const configs = {
            NEW: { style: 'bg-blue-50 text-blue-700 border-blue-200', icon: Mail, dot: 'bg-blue-500' },
            READ: { style: 'bg-amber-50 text-amber-700 border-amber-200', icon: MailOpen, dot: 'bg-amber-500' },
            REPLIED: { style: 'bg-[#29a08e]/10 text-[#29a08e] border-[#29a08e]/20', icon: Reply, dot: 'bg-[#29a08e]' },
            RESOLVED: { style: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, dot: 'bg-emerald-500' },
        };
        const config = configs[status] || configs.NEW;
        const Icon = config.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.style}`}>
                <Icon className="w-3 h-3" />
                {status}
            </span>
        );
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-64px)]">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
                <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-10 w-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                                    <MessageSquare className="h-5 w-5 text-cyan-400" />
                                </div>
                                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Support Inbox</span>
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Contact Messages</h1>
                            <p className="text-gray-400 mt-1.5 font-medium text-sm">Manage and respond to messages from the public Contact Us page.</p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {[
                                { label: 'New', count: statusCounts.NEW, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
                                { label: 'Read', count: statusCounts.READ, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
                                { label: 'Replied', count: statusCounts.REPLIED, color: 'bg-[#29a08e]/20 text-[#5eead4] border-[#29a08e]/30' },
                                { label: 'Resolved', count: statusCounts.RESOLVED, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                            ].map((pill, i) => (
                                <div key={i} className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold ${pill.color}`}>
                                    {pill.count} {pill.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                    {/* Search and Filter Bar */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-gray-50 rounded-xl p-1 border border-gray-200">
                                {['ALL', 'NEW', 'READ', 'REPLIED', 'RESOLVED'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s
                                            ? 'bg-[#29a08e] text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                            <button onClick={fetchMessages} className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl text-xs font-bold transition-all hover:shadow-sm border border-gray-200">
                                <RefreshCw className="h-3.5 w-3.5" />
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Sender</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Subject</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Date</th>
                                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="5" className="px-6 py-5">
                                                <div className="h-10 bg-gray-50 rounded-xl w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredMessages.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <MessageSquare className="w-7 h-7 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">No messages found</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {statusFilter !== 'ALL' ? `No ${statusFilter.toLowerCase()} messages.` : 'The inbox is empty.'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredMessages.map((msg) => (
                                    <tr key={msg._id} className={`hover:bg-[#29a08e]/[0.02] transition-colors group ${msg.status === 'NEW' ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm ${msg.status === 'NEW' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                                    {msg.fullName?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm truncate group-hover:text-[#29a08e] transition-colors ${msg.status === 'NEW' ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                        {msg.fullName}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">{msg.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className={`text-sm truncate max-w-[250px] ${msg.status === 'NEW' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                {msg.subject}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(msg.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-xs text-gray-400 font-medium">{timeAgo(msg.createdAt)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleView(msg)}
                                                    className="p-2 text-gray-400 hover:text-[#29a08e] rounded-xl hover:bg-[#29a08e]/10 transition-all border border-transparent hover:border-[#29a08e]/20"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {msg.status !== 'REPLIED' && (
                                                    <button
                                                        onClick={() => handleReplyClick(msg)}
                                                        className="px-3 py-1.5 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-xl text-xs font-bold hover:from-[#29a08e] hover:to-[#228377] transition-all shadow-sm"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                                {msg.status === 'REPLIED' && (
                                                    <button
                                                        onClick={() => handleStatusChange(msg._id, 'RESOLVED')}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-200"
                                                    >
                                                        Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs text-gray-400 font-medium">
                            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} displayed
                        </p>
                    </div>
                </div>
            </main>

            {/* ========== VIEW MODAL ========== */}
            {showViewModal && selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setShowViewModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100" style={{ maxHeight: '90vh' }}>
                        {/* Modal Header */}
                        <header className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white">
                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative flex justify-between items-start">
                                <div className="min-w-0 pr-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-cyan-400 shrink-0" />
                                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Contact Message</span>
                                    </div>
                                    <h3 className="text-lg font-black truncate">{selectedMessage.subject}</h3>
                                </div>
                                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                            {/* Sender Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {selectedMessage.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 text-sm">{selectedMessage.fullName}</p>
                                    <p className="text-xs text-gray-400">{selectedMessage.email}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {getStatusBadge(selectedMessage.status)}
                                    <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                        {new Date(selectedMessage.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Message Body */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Message</p>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedMessage.message}
                                </div>
                            </div>

                            {/* Admin Reply (if exists) */}
                            {selectedMessage.adminReply && (
                                <div>
                                    <p className="text-[10px] font-bold text-[#29a08e] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Reply className="w-3 h-3" /> Admin Reply
                                    </p>
                                    <div className="p-4 bg-[#29a08e]/5 rounded-xl border border-[#29a08e]/15 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedMessage.adminReply}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">
                                        Replied by {selectedMessage.repliedBy?.fullName || 'Admin'} • {selectedMessage.repliedAt ? new Date(selectedMessage.repliedAt).toLocaleString() : ''}
                                    </p>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                {selectedMessage.status !== 'REPLIED' && selectedMessage.status !== 'RESOLVED' && (
                                    <button
                                        onClick={() => { setShowViewModal(false); handleReplyClick(selectedMessage); }}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        <Reply className="w-4 h-4" /> Reply to Message
                                    </button>
                                )}
                                {selectedMessage.status === 'REPLIED' && (
                                    <button
                                        onClick={() => { handleStatusChange(selectedMessage._id, 'RESOLVED'); setShowViewModal(false); }}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Mark as Resolved
                                    </button>
                                )}
                                {selectedMessage.status === 'READ' && (
                                    <button
                                        onClick={() => handleStatusChange(selectedMessage._id, 'NEW')}
                                        className="px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200"
                                    >
                                        Mark Unread
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== REPLY MODAL ========== */}
            {showReplyModal && selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={() => setShowReplyModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
                        {/* Reply Modal Header */}
                        <header className="relative p-6 border-b border-gray-100 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white">
                            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                            <div className="relative flex justify-between items-start">
                                <div className="min-w-0 pr-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Reply className="w-4 h-4 text-[#29a08e]" />
                                        <span className="text-[10px] font-bold text-[#29a08e] uppercase tracking-widest">Reply to Message</span>
                                    </div>
                                    <h3 className="text-lg font-black truncate">Re: {selectedMessage.subject}</h3>
                                </div>
                                <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </header>

                        <div className="p-6 space-y-5">
                            {/* Recipient Info */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                                    {selectedMessage.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900">{selectedMessage.fullName}</p>
                                    <p className="text-xs text-gray-400">{selectedMessage.email}</p>
                                </div>
                            </div>

                            {/* Original Message Preview */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Original Message</p>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 italic line-clamp-3">
                                    "{selectedMessage.message}"
                                </div>
                            </div>

                            {/* Reply Textarea */}
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Your Reply</p>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..."
                                    rows={5}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#29a08e]/30 focus:border-[#29a08e] outline-none resize-none transition-all"
                                />
                                <p className="text-[10px] text-gray-400 mt-1.5">
                                    This reply will be emailed to <strong className="text-gray-500">{selectedMessage.email}</strong>
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowReplyModal(false)}
                                    className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={replying || !replyText.trim()}
                                    className="flex-1 py-3 bg-gradient-to-r from-[#29a08e] to-[#228377] text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#29a08e]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
                                >
                                    {replying ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContactMessages;
