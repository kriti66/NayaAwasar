import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const RecruiterJobs = () => {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // In a real app we'd have /jobs/my or filter by recruiter_id in query
                const res = await api.get('/jobs');
                // Filter client side for MVP since I didn't make a specific endpoint
                const myJobs = res.data.filter(job => job.recruiter_id === user.id);
                setJobs(myJobs);
            } catch (error) {
                console.error(error);
            }
        };
        if (user) fetchJobs();
    }, [user]);

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 overflow-auto p-8">
                <h1 className="text-2xl font-bold mb-6">My Jobs</h1>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {jobs.map((job) => (
                            <li key={job.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600 truncate">{job.title}</p>
                                            <div className="mt-1 flex space-x-2">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    {job.type}
                                                </span>
                                                <Link to={`/recruiter/jobs/${job.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 sm:flex sm:justify-between">
                                        <div className="sm:flex">
                                            <p className="flex items-center text-sm text-gray-500">
                                                {job.location}
                                            </p>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                            <p>
                                                Posted on {new Date(job.posted_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {jobs.length === 0 && <div className="p-4 text-center text-gray-500">No jobs posted yet.</div>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RecruiterJobs;
