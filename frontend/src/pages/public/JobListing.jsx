import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
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
        <Layout>
            <div className="bg-gray-50 min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
                        <p className="text-gray-500 mt-2">{filteredJobs.length} jobs found</p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Sidebar Filters */}
                        <div className="w-full lg:w-64 flex-shrink-0 space-y-8 bg-white p-6 rounded-lg border border-gray-200 h-fit">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Filter Jobs</h3>

                            {/* Keywords */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="e.g. Frontend Developer"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. San Francisco"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                                />
                            </div>

                            {/* Job Type Checkboxes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                                <div className="space-y-2">
                                    {Object.keys(jobTypes).map(type => (
                                        <label key={type} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={jobTypes[type]}
                                                onChange={() => handleCheckboxChange('type', type)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Experience Level Checkboxes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                                <div className="space-y-2">
                                    {Object.keys(experienceLevels).map(level => (
                                        <label key={level} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={experienceLevels[level]}
                                                onChange={() => handleCheckboxChange('level', level)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{level}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Salary Range Slider */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>$20k</span>
                                    <span>$200k</span>
                                </div>
                                <input
                                    type="range"
                                    min="20000"
                                    max="200000"
                                    step="10000"
                                    value={salaryRange}
                                    onChange={(e) => setSalaryRange(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="text-center mt-2 text-sm font-bold text-gray-700">
                                    ${salaryRange.toLocaleString()} +
                                </div>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="w-full text-sm text-red-500 font-medium hover:text-red-700 mt-4 block text-center"
                            >
                                Clear Filters
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1">
                            <div className="flex justify-end mb-4 text-sm text-gray-500">
                                <span>Sort by: <span className="font-medium text-gray-900">relevance</span></span>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-gray-500">Loading jobs...</div>
                            ) : filteredJobs.length > 0 ? (
                                <div className="grid gap-6 md:grid-cols-2">
                                    {filteredJobs.map((job) => (
                                        <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                            {/* Bookmark Icon */}
                                            <button className="absolute top-6 right-6 text-gray-400 hover:text-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                                </svg>
                                            </button>

                                            <div className="flex items-start mb-4">
                                                {/* Logo Placeholder */}
                                                <div className="h-12 w-12 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-500 font-bold text-lg mr-4">
                                                    {job.company_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{job.title}</h3>
                                                    <p className="text-sm text-gray-500">{job.company_name} • {job.location || 'Remote'}</p>
                                                </div>
                                            </div>

                                            {/* Salary Badge */}
                                            <div className="mb-4">
                                                <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium">
                                                    {job.salary_range || '$60,000 - $80,000'}
                                                </span>
                                            </div>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                                    {job.type}
                                                </span>
                                                <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                                                    Mid-level
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-3">
                                                <Link
                                                    to={`/jobs/${job.id}`}
                                                    className="flex-1 py-2 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 text-center hover:bg-gray-50"
                                                >
                                                    View Details
                                                </Link>
                                                <button className="flex-1 py-2 px-4 bg-blue-600 rounded-md text-sm font-medium text-white text-center hover:bg-blue-700">
                                                    Apply Now
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200">
                                    No jobs found matching your criteria.
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredJobs.length > 0 && (
                                <div className="mt-8 flex justify-center space-x-2">
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                        &lt;
                                    </button>
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-medium">
                                        1
                                    </button>
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                        2
                                    </button>
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                        3
                                    </button>
                                    <button className="h-8 w-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                                        &gt;
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default JobListing;
