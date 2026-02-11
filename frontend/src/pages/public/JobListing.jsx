import { useState, useEffect } from 'react';

import api from '../../services/api';
import { Link } from 'react-router-dom';

const JobListing = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters State
    const [keyword, setKeyword] = useState('');
    const [location, setLocation] = useState('');
    const [jobTypes, setJobTypes] = useState({
        'Full-time': false,
        'Part-time': false,
        'Contract': false,
        'Internship': false
    });
    const [experienceLevels, setExperienceLevels] = useState({
        'Entry-level': false,
        'Mid-level': false,
        'Senior': false,
        'Executive': false
    });
    const [salaryRange, setSalaryRange] = useState(20000);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await api.get('/jobs');
                setJobs(res.data);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const handleCheckboxChange = (category, value) => {
        if (category === 'type') {
            setJobTypes(prev => ({ ...prev, [value]: !prev[value] }));
        } else if (category === 'level') {
            setExperienceLevels(prev => ({ ...prev, [value]: !prev[value] }));
        }
    };

    const clearFilters = () => {
        setKeyword('');
        setLocation('');
        setJobTypes({
            'Full-time': false,
            'Part-time': false,
            'Contract': false,
            'Internship': false
        });
        setExperienceLevels({
            'Entry-level': false,
            'Mid-level': false,
            'Senior': false,
            'Executive': false
        });
        setSalaryRange(20000);
    };

    // Filter Logic
    const filteredJobs = jobs.filter(job => {
        const matchesKeyword = job.title.toLowerCase().includes(keyword.toLowerCase()) ||
            job.company_name.toLowerCase().includes(keyword.toLowerCase());

        const matchesLocation = location === '' || job.location.toLowerCase().includes(location.toLowerCase());

        // Check active job type filters
        const activeJobTypes = Object.keys(jobTypes).filter(type => jobTypes[type]);
        const matchesType = activeJobTypes.length === 0 || activeJobTypes.includes(job.type);

        // Placeholder logic for experience/salary if not in current API data
        return matchesKeyword && matchesLocation && matchesType;
    });

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Explore <span className="text-blue-600">Jobs</span></h1>
                        <p className="text-gray-500 mt-1">{filteredJobs.length} opportunities available</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Sidebar Filters */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-fit sticky top-24">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>

                        {/* Keywords */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Keyword</label>
                            <input
                                type="text"
                                placeholder="Job title, company..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                placeholder="City, region..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        </div>

                        {/* Job Type Checkboxes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                            <div className="space-y-2">
                                {Object.keys(jobTypes).map(type => (
                                    <label key={type} className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={jobTypes[type]}
                                            onChange={() => handleCheckboxChange('type', type)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Experience Level */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                            <div className="space-y-2">
                                {Object.keys(experienceLevels).map(level => (
                                    <label key={level} className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={experienceLevels[level]}
                                            onChange={() => handleCheckboxChange('level', level)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">{level}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={clearFilters}
                            className="w-full py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors border border-blue-100 rounded-lg hover:bg-blue-50"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading jobs...</p>
                            </div>
                        ) : filteredJobs.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-1">
                                {filteredJobs.map((job) => (
                                    <div key={job._id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start">
                                                <div className="h-12 w-12 bg-blue-50 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-600 font-bold text-lg border border-blue-100">
                                                    {job.company_name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <h3 className="font-bold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                                                        <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <span className="text-sm font-medium text-gray-500">{job.company_name}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-sm text-gray-500">{job.location || 'Remote'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="text-gray-300 hover:text-blue-600 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                                                    {job.type}
                                                </span>
                                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                                                    {job.salary_range || 'Competitive'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <Link
                                                    to={`/jobs/${job._id}`}
                                                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    Details
                                                </Link>
                                                <Link
                                                    to={`/apply/${job._id}`}
                                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm text-center"
                                                >
                                                    Apply
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">No jobs found</h3>
                                <p className="text-gray-500 mt-1">Try adjusting your filters.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredJobs.length > 0 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center space-x-2">
                                    <button className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-blue-600 border border-transparent hover:border-gray-200 transition-all">
                                        &larr;
                                    </button>
                                    {[1, 2, 3].map(p => (
                                        <button key={p} className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${p === 1 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-white hover:text-blue-600 border border-transparent hover:border-gray-200'}`}>
                                            {p}
                                        </button>
                                    ))}
                                    <button className="p-2 rounded-lg text-gray-400 hover:bg-white hover:text-blue-600 border border-transparent hover:border-gray-200 transition-all">
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobListing;
