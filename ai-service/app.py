from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import os
from dotenv import load_dotenv
import numpy as np
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kritibista:kriti123@cluster0.mongodb.net/nayaawasar?retryWrites=true&w=majority")
PORT = int(os.getenv("PORT", 5002))

client = None
db = None
jobs_collection = None

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database("nayaawasar") # Ensure this matches your DB name
    jobs_collection = db["jobs"]
    # Check connection
    client.admin.command('ping')
    print(f"✅ Connected to MongoDB: {db.name}")
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    status = "healthy" if client else "unhealthy"
    return jsonify({"status": status, "service": "AI Recommendation Service"}), 200

def get_jobs_dataframe():
    """Fetches jobs from MongoDB and prepares a DataFrame."""
    try:
        # Fetch only necessary fields, ensure we get both old and new schema fields
        projection = {
            '_id': 1, 
            'title': 1, 
            'job_title': 1, 
            'description': 1, 
            'job_description': 1, 
            'requirements': 1, 
            'skills': 1, 
            'company_name': 1, 
            'location': 1,
            'salary_range': 1,
            'type': 1,
            'job_type': 1,
            'posted_date': 1
        }
        
        jobs_cursor = jobs_collection.find({}, projection)
        jobs = list(jobs_cursor)
        
        if not jobs:
            return pd.DataFrame()

        df = pd.DataFrame(jobs)
        
        # Normalize fields (handle both old and new schema)
        # Priority: New Schema (job_title) -> Old Schema (title) -> Empty
        df['final_title'] = df['job_title'].fillna(df['title']).fillna('')
        df['final_desc'] = df['job_description'].fillna(df['description']).fillna('')
        df['final_reqs'] = df['requirements'].fillna('')
        
        # Ensure text fields are strings
        df['final_title'] = df['final_title'].astype(str)
        df['final_desc'] = df['final_desc'].astype(str)
        df['final_reqs'] = df['final_reqs'].astype(str)
        
        # Combine text for vectorization
        df['combined_text'] = (
            df['final_title'] + " " + 
            df['final_desc'] + " " + 
            df['final_reqs']
        )
        
        return df
    except Exception as e:
        print(f"Error fetching jobs: {e}")
        return pd.DataFrame()

@app.route('/recommend', methods=['POST'])
def recommend_jobs():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400
            
        user_skills = data.get('skills', '')
        
        if not user_skills:
            return jsonify({"error": "No skills provided"}), 400

        # Fetch jobs
        df = get_jobs_dataframe()
        
        if df.empty:
            return jsonify({"message": "No jobs found", "jobs": []}), 200

        # Feature Extraction
        tfidf = TfidfVectorizer(stop_words='english')
        
        # If corpus is too small, it might fail? No, just warns.
        try:
            tfidf_matrix = tfidf.fit_transform(df['combined_text'])
        except ValueError:
             return jsonify({"message": "Not enough data to generate recommendations", "jobs": []}), 200

        user_vector = tfidf.transform([user_skills])
        
        # Similarity
        cosine_sim = cosine_similarity(user_vector, tfidf_matrix)
        
        # Get top matches
        scores = cosine_sim[0]
        # Get indices of top 5 scores
        top_indices = scores.argsort()[-5:][::-1]
        
        recommended_jobs = []
        for idx in top_indices:
            score = scores[idx]
            if score > 0.01: # Lower threshold to ensure *some* results if keywords match at all
                job = df.iloc[idx]
                
                job_dict = {
                    "job_id": str(job['_id']),
                    "title": job['final_title'],
                    "company": job.get('company_name', 'Unknown'),
                    "location": job.get('location', 'Remote'),
                    "type": job.get('job_type', job.get('type', 'Full-time')),
                    "salary_range": job.get('salary_range', 'Not disclosed'),
                    "posted_date": str(job.get('posted_date', '')),
                    "match_score": round(float(score) * 100, 2)
                }
                recommended_jobs.append(job_dict)
        
        return jsonify({
            "jobs": recommended_jobs,
            "count": len(recommended_jobs)
        })

    except Exception as e:
        print(f"Error in recommendation: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print(f"🚀 AI Service running on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
