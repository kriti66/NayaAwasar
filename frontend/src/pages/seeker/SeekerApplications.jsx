import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';

const SeekerApplications = () => {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await api.get('/applications/my');
                setApplications(res.data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchApps();
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <h1 className="text-2xl font-bold mb-6">My Applications</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {applications.map((app) => (
                            <li key={app.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-blue-600 truncate">{app.title}</p>
                                        <div className="ml-2 flex-shrink-0 flex">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {app.company_name} - {app.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {applications.length === 0 && <div className="p-4 text-center text-gray-500">You haven't applied to any jobs yet.</div>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SeekerApplications;
