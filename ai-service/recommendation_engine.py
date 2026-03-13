import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId

def build_job_text(job):
    """Combine job fields into a single text document for TF-IDF"""
    title = job.get('job_title', job.get('title', ''))
    desc = job.get('job_description', job.get('description', ''))
    reqs = job.get('requirements', '')
    company = job.get('company_name', '')
    location = job.get('location', '')
    job_type = job.get('job_type', job.get('type', ''))
    
    components = [str(x) for x in [title, desc, reqs, company, location, job_type] if x]
    return " ".join(components).lower()

def build_user_text(user, profile=None):
    """Combine user and profile fields into a single text document"""
    text_components = []
    
    # Text from user model
    if user.get('userProfileText'):
        text_components.append(user['userProfileText'])
    else:
        # Fallback to combining individual fields
        if user.get('professionalHeadline'): text_components.append(user['professionalHeadline'])
        if user.get('bio'): text_components.append(user['bio'])
        if user.get('skills'): 
            skills = user['skills']
            if isinstance(skills, list): text_components.append(" ".join(skills))
            elif isinstance(skills, str): text_components.append(skills)
    
    # Text from profile model
    if profile:
        if profile.get('headline'): text_components.append(profile['headline'])
        if profile.get('summary'): text_components.append(profile['summary'])
        if profile.get('skills'):
            text_components.append(" ".join(profile['skills']) if isinstance(profile['skills'], list) else str(profile['skills']))
            
    return " ".join([str(x) for x in text_components if x]).lower()

def get_explanation_and_skills(user_text, job_text, vectorizer):
    """Simple heuristic to find overlapping keywords between user and job to provide explanation."""
    user_words = set(user_text.split())
    job_words = set(job_text.split())
    
    # Filter by vocabulary to only keep meaningful words
    vocab = vectorizer.vocabulary_
    user_meaningful = [w for w in user_words if w in vocab]
    job_meaningful = [w for w in job_words if w in vocab]
    
    matched_skills = list(set(user_meaningful).intersection(set(job_meaningful)))
    # We only show a limited set of missing skills, e.g. up to 5 longest ones or highest IDF
    missing_skills = list(set(job_meaningful) - set(user_meaningful))
    
    # Pick a few sample matched and missing skills
    matched_sample = matched_skills[:5] if len(matched_skills) > 5 else matched_skills
    missing_sample = missing_skills[:3] if len(missing_skills) > 3 else missing_skills
    
    reason = "Matched based on overall profile."
    if matched_sample:
        reason = f"Your profile strongly matches the following job requirements: {', '.join(matched_sample)}."
        
    return matched_sample, missing_sample, reason


def recommend_jobs_for_user(user_id, db):
    user = db['users'].find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}
        
    profile = db['profiles'].find_one({"userId": ObjectId(user_id)})
    
    user_text = build_user_text(user, profile)
    if not user_text.strip():
        return {"error": "User profile lacks sufficient text for recommendation."}
        
    # Get all active jobs
    jobs = list(db['jobs'].find({"status": "Active"}))
    if not jobs:
        return {"error": "No active jobs found"}
        
    # Optional: exclude jobs already applied to
    applied_apps = list(db['applications'].find({"seeker_id": ObjectId(user_id)}))
    applied_job_ids = [str(app.get("job_id")) for app in applied_apps if app.get("job_id")]
    
    candidate_jobs = [job for job in jobs if str(job["_id"]) not in applied_job_ids]
    if not candidate_jobs:
        return {"error": "No new jobs available to recommend (already applied to all active jobs)."}
        
    job_texts = [build_job_text(job) for job in candidate_jobs]
    all_texts = [user_text] + job_texts
    
    vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
         return {"error": "Not enough vocabulary to compute recommendations."}
         
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    related_docs_indices = cosine_sim.argsort()[::-1]
    
    recommendations = []
    for i in related_docs_indices:
        score = float(cosine_sim[i])
        if score > 0.05: # Threshold
            job = candidate_jobs[i]
            matched, missing, reason = get_explanation_and_skills(user_text, job_texts[i], vectorizer)
            
            job_dict = {
                "job_id": str(job['_id']),
                "title": job.get('job_title', job.get('title', '')),
                "company": job.get('company_name', 'Unknown'),
                "location": job.get('location', 'Remote'),
                "type": job.get('job_type', job.get('type', 'Full-time')),
                "salary_range": job.get('salary_range', 'Not disclosed'),
                "posted_date": str(job.get('posted_date', str(job.get('createdAt', '')))),
                "match_score": round(score * 100, 2),
                "matched_skills": matched,
                "missing_skills": missing,
                "explanation": reason
            }
            recommendations.append(job_dict)
            if len(recommendations) >= 10: # Return top 10
                break
                
    return {"jobs": recommendations, "count": len(recommendations)}


def recommend_candidates_for_job(job_id, db):
    job = db['jobs'].find_one({"_id": ObjectId(job_id)})
    if not job:
        return {"error": "Job not found"}
        
    job_text = build_job_text(job)
    if not job_text.strip():
        return {"error": "Job lacks sufficient text for recommendation."}
        
    # Get jobseekers
    users_cursor = db['users'].find({"role": "jobseeker"})
    candidate_users = []
    user_texts = []
    
    for u in users_cursor:
        profile = db['profiles'].find_one({"userId": u["_id"]})
        text = build_user_text(u, profile)
        if text.strip():
            candidate_users.append(u)
            user_texts.append(text)
            
    if not candidate_users:
        return {"error": "No candidates found."}
        
    all_texts = [job_text] + user_texts
    
    vectorizer = TfidfVectorizer(stop_words='english', min_df=1)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
         return {"error": "Not enough vocabulary to compute recommendations."}
         
    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    related_docs_indices = cosine_sim.argsort()[::-1]
    
    recommendations = []
    for i in related_docs_indices:
        score = float(cosine_sim[i])
        if score > 0.05: # Threshold
            user = candidate_users[i]
            matched, missing, reason = get_explanation_and_skills(user_texts[i], job_text, vectorizer)
            
            # Recruiter specific explanation
            reason = "Candidate matches overall job profile."
            if matched:
                reason = f"Candidate possesses the following required skills: {', '.join(matched)}."
            
            user_dict = {
                "user_id": str(user['_id']),
                "full_name": user.get('fullName', 'Unknown Candidate'),
                "headline": user.get('professionalHeadline', ''),
                "location": user.get('location', 'Remote'),
                "email": user.get('email', ''), # Might want to hide if pending
                "match_score": round(score * 100, 2),
                "matched_skills": matched,
                "missing_skills": missing,
                "explanation": reason
            }
            recommendations.append(user_dict)
            if len(recommendations) >= 10:
                break
                
    return {"candidates": recommendations, "count": len(recommendations)}
