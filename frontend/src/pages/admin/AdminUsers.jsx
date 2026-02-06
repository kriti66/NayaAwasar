import { useState, useEffect } from 'react';
import DashboardNavbar from '../../components/dashboard/DashboardNavbar';
import api from '../../services/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u.id !== id));
            alert("User deleted successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to delete user.");
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-400">Loading users...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 w-full">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                        <p className="text-gray-500 mt-1">Review and manage platform members.</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">{users.length}</span>
                        <span className="text-sm text-gray-500 ml-1">Total Users</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {['Name', 'Email', 'Role', 'Actions'].map((head) => (
                                        <th key={head} className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{head}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-500">{user.email}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : user.role === 'recruiter'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-green-100 text-green-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminUsers;
