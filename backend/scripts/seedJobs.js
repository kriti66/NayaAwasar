import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Import Models
import Job from '../models/Job.js';
import Company from '../models/Company.js';
import User from '../models/User.js';

// Configure Environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in .env file.');
    process.exit(1);
}

const seedJobs = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Read JSON Data
        const jsonPath = path.join(__dirname, '..', '..', 'nepal_5000_nayaawasar_jobs.json');
        if (!fs.existsSync(jsonPath)) {
            console.error(`❌ JSON file not found at ${jsonPath}`);
            process.exit(1);
        }

        const rawData = fs.readFileSync(jsonPath, 'utf-8');
        const jobsData = JSON.parse(rawData);

        console.log(`📂 Loaded ${jobsData.length} jobs from JSON.`);

        // Cache for Companies and Recruiters to reduce DB calls
        const companyCache = {};
        const recruiterCache = {};

        let createdJobsCount = 0;
        let skippedJobsCount = 0;

        for (const jobData of jobsData) {
            const {
                job_title,
                company_name,
                location,
                job_type,
                salary_range,
                posted_date,
                application_deadline,
                job_description,
                requirements
            } = jobData;

            // 1. Find or Create Company
            let companyId;
            if (companyCache[company_name]) {
                companyId = companyCache[company_name]._id;
            } else {
                let company = await Company.findOne({
                    $or: [{ name: company_name }, { company_name: company_name }]
                });

                if (!company) {
                    const sanitizedName = company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                    company = await Company.create({
                        name: company_name,
                        company_name: company_name,
                        headquarters: location, // Use job location as headquarters for simplicity if new
                        industry: 'Technology', // Default
                        size: '51-200 employees', // Default
                        contact: {
                            email: `info@${sanitizedName}.com`,
                            address: location
                        },
                        verification_status: 'Verified',
                        status: 'approved',
                        rating: 4.5
                    });
                    console.log(`🏢 Created Company: ${company_name}`);
                }
                companyCache[company_name] = company;
                companyId = company._id;
            }

            // 2. Find or Create Recruiter (User)
            let recruiterId;
            if (recruiterCache[company_name]) {
                recruiterId = recruiterCache[company_name]._id;
            } else {
                // Generate a consistent dummy email for the recruiter of this company
                const sanitizedName = company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const recruiterEmail = `recruiter@${sanitizedName}.com`;

                let recruiter = await User.findOne({ email: recruiterEmail });

                if (!recruiter) {
                    const hashedPassword = await bcrypt.hash('password123', 10);
                    recruiter = await User.create({
                        fullName: `${company_name} Recruiter`,
                        email: recruiterEmail,
                        password: hashedPassword,
                        role: 'recruiter',
                        kycStatus: 'approved',
                        recruiterKycStatus: 'approved',
                        isKycVerified: true
                    });
                    console.log(`👤 Created Recruiter: ${recruiterEmail}`);
                }
                recruiterCache[company_name] = recruiter;
                recruiterId = recruiter._id;
            }

            // 3. Create Job
            // Check for duplicate job to avoid re-seeding same data if run multiple times?
            // For now, we'll assume we want to insert. 
            // The prompt says "insert fields", doesn't explicitly ask for deduplication of jobs, just companies.
            // But good practice is to check.
            const existingJob = await Job.findOne({
                title: job_title,
                company_id: companyId,
                'location': location
            });

            if (!existingJob) {
                await Job.create({
                    job_title: job_title,
                    title: job_title, // Map to existing field

                    company_name: company_name,
                    company_id: companyId,
                    company: companyId, // Map to new field

                    recruiter_id: recruiterId,
                    recruiter: recruiterId, // Map to new field

                    location: location,

                    job_type: job_type,
                    type: job_type, // Map to existing field

                    salary_range: salary_range,

                    posted_date: new Date(posted_date),
                    createdAt: new Date(posted_date), // Sync createdAt

                    application_deadline: new Date(application_deadline),
                    reviewDeadline: new Date(application_deadline), // Sync existing field

                    job_description: job_description,
                    description: job_description, // Map to existing field

                    requirements: requirements,

                    status: 'Active',
                    moderationStatus: 'Approved'
                });
                createdJobsCount++;
            } else {
                skippedJobsCount++;
            }

            if ((createdJobsCount + skippedJobsCount) % 100 === 0) {
                console.log(`⏳ Processed ${createdJobsCount + skippedJobsCount} jobs...`);
            }
        }

        console.log(`\n🎉 Seeding Integration Complete!`);
        console.log(`✅ Jobs Created: ${createdJobsCount}`);
        console.log(`⏭️ Jobs Skipped (Duplicate): ${skippedJobsCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedJobs();
