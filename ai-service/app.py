from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from database import get_db
from recommendation_engine import recommend_jobs_for_user, recommend_candidates_for_job

app = Flask(__name__)
CORS(app)

# Initialize DB
client, db = get_db()
PORT = int(os.getenv("PORT", 5002))

@app.route('/health', methods=['GET'])
def health_check():
    status = "healthy" if client is not None else "unhealthy"
    return jsonify({
        "status": status,
        "service": "NayaAwasar AI Recommendation Microservice",
        "database": db.name if db is not None else "Disconnected"
    }), 200

@app.route('/recommend-jobs/<user_id>', methods=['POST'])
def get_job_recommendations(user_id):
    """
    Returns AI-recommended jobs based on the user's profile data vs recruiter-posted jobs.
    No external data sources used.
    """
    if db is None:
       return jsonify({"error": "Database disconnected"}), 503
       
    try:
        result = recommend_jobs_for_user(user_id, db)
        if "error" in result:
            return jsonify(result), 400
            
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error recommending jobs: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/recommend-candidates/<job_id>', methods=['POST'])
def get_candidate_recommendations(job_id):
    """
    Returns AI-recommended candidates (jobseekers) for a specific job posted by a recruiter.
    """
    if db is None:
       return jsonify({"error": "Database disconnected"}), 503
       
    try:
        result = recommend_candidates_for_job(job_id, db)
        if "error" in result:
            return jsonify(result), 400
            
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Error recommending candidates: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print(f"NayaAwasar AI Recommendation Service running on port {PORT}")
    app.run(host='0.0.0.0', port=PORT, debug=True)
