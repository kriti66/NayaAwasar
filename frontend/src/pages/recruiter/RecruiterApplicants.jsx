import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const RecruiterApplicants = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch Recruiter's Jobs
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs');
                const myJobs = res.data.filter(job => job.recruiter_id === user.id);
                setJobs(myJobs);
                if (myJobs.length > 0) {
                    setSelectedJobId(myJobs[0].id);
                }
            } catch (error) {
                console.error("Error fetching jobs", error);
            }
        };
        if (user) fetchJobs();
    }, [user]);

    // Fetch Applicants when Job Selected
    useEffect(() => {
        const fetchApplicants = async () => {
            if (!selectedJobId) return;
            setLoading(true);
            try {
                const res = await api.get(`/applications/job/${selectedJobId}`);
                setApplicants(res.data);
            } catch (error) {
                console.error("Error fetching applicants", error);
            } finally {
                setLoading(false);
            }
        };
        fetchApplicants();
    }, [selectedJobId]);

    const handleStatusUpdate = async (appId, newStatus) => {
        try {
            await api.put(`/applications/${appId}/status`, { status: newStatus });
            // Update local state
            setApplicants(applicants.map(app =>
                app.id === appId ? { ...app, status: newStatus } : app
            ));
        } catch (error) {
            console.error("Error updating status", error);
            alert("Failed to update status");
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Manage Applicants</h1>
                    <div className="w-64">
                        <select
                            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                        >
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? <div className="text-center">Loading...</div> : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resume</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applicants.map((app) => (
                                    <tr key={app.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{app.seeker_name}</div>
                                                    <div className="text-sm text-gray-500">{app.seeker_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(app.applied_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${app.status === 'shortlisted' ? 'bg-green-100 text-green-800' :
                                                app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {app.resume_url ? (
                                                <a href={`http://localhost:5000${app.resume_url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                    View CV
                                                </a>
                                            ) : (
                                                <span className="text-gray-400">Not Uploaded</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button onClick={() => handleStatusUpdate(app.id, 'shortlisted')} className="text-green-600 hover:text-green-900">Shortlist</button>
                                            <button onClick={() => handleStatusUpdate(app.id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                        </td>
                                    </tr>
                                ))}
                                {applicants.length === 0 && <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No applicants found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecruiterApplicants;
