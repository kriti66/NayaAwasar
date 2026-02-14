import json
import random
from datetime import datetime, timedelta

companies = ["Deerwalk", "Leapfrog", "CloudFactory", "Fusemachines",
             "WorldLink", "CG Group", "NIC Asia Bank", "Nabil Bank",
             "Himalayan Bank", "F1Soft", "InfoDevelopers", "Khalti",
             "eSewa", "Smart Tech Nepal", "IMS Group"]

locations = ["Kathmandu", "Lalitpur", "Bhaktapur",
             "Itahari", "Biratnagar", "Pokhara",
             "Butwal", "Dharan", "Chitwan"]

job_titles = [
    "Frontend Developer", "Backend Developer", "Full Stack Developer",
    "Data Analyst", "Data Scientist", "Mobile App Developer",
    "Project Manager", "HR Officer", "Business Analyst",
    "Digital Marketing Officer", "SEO Specialist",
    "Network Engineer", "System Administrator",
    "Bank Officer", "Teacher", "Accountant",
    "Graphic Designer", "UI UX Designer"
]

skills_map = {
    "Frontend Developer": "React, JavaScript, HTML, CSS",
    "Backend Developer": "NodeJS, Express, MongoDB",
    "Full Stack Developer": "React, NodeJS, MongoDB",
    "Data Analyst": "Python, SQL, Excel",
    "Data Scientist": "Python, Machine Learning",
    "Mobile App Developer": "Flutter, Dart, Firebase",
    "Project Manager": "Agile, Scrum, Leadership",
    "HR Officer": "Recruitment, Communication",
    "Business Analyst": "Analysis, Documentation",
    "Digital Marketing Officer": "SEO, Google Ads",
    "SEO Specialist": "SEO, Analytics",
    "Network Engineer": "Cisco, Networking",
    "System Administrator": "Linux, Servers",
    "Bank Officer": "Finance, Customer Service",
    "Teacher": "Subject Knowledge, Teaching",
    "Accountant": "Accounting, Tally",
    "Graphic Designer": "Photoshop, Illustrator",
    "UI UX Designer": "Figma, Prototyping"
}

data = []

for i in range(5000):
    title = random.choice(job_titles)
    company = random.choice(companies)
    location = random.choice(locations)
    min_salary = random.randint(25000, 80000)
    max_salary = min_salary + random.randint(10000, 40000)

    posted_date = datetime.now() - timedelta(days=random.randint(0, 60))
    deadline = posted_date + timedelta(days=random.randint(15, 45))

    job = {
        "job_title": title,
        "company_name": company,
        "location": location,
        "job_type": "Full-time",
        "salary_range": f"NPR {min_salary:,} - {max_salary:,}",
        "posted_date": posted_date.strftime("%Y-%m-%d"),
        "application_deadline": deadline.strftime("%Y-%m-%d"),
        "job_description": f"{title} position at {company} in {location}.",
        "requirements": f"Required skills: {skills_map[title]}. 1-3 years experience."
    }

    data.append(job)

with open("nepal_5000_nayaawasar_jobs.json", "w") as f:
    json.dump(data, f, indent=4)

print("✅ 5000 Nepal Jobs Dataset Created!")
