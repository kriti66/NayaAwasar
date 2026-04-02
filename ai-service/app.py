from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from database import get_db
from recommendation_engine import (
    recommend_jobs_for_user,
    recommend_candidates_for_job,
    recommend_from_profile_and_jobs,
)

app = Flask(__name__)
CORS(app)

# Initialize DB
client, db = get_db()
PORT = int(os.getenv("PORT", 5000))

@app.route("/recommend", methods=["POST"])
def recommend_from_express():
    """
    Body JSON:
      seeker_profile: dict (skills, bio, jobPreferences, etc.)
      jobs: list of job dicts with _id, title, description, ...
      limit: int (optional, default 10, max 50)
    Returns: { recommendations: [{ jobId, similarityScore, matchReason, job_id, similarity_score, reason }], total }
    """
    try:
        body = request.get_json(force=True, silent=True) or {}
    except Exception:
        return jsonify({"error": "Invalid JSON"}), 400

    seeker_profile = body.get("seeker_profile")
    jobs = body.get("jobs")
    if not isinstance(seeker_profile, dict):
        return jsonify({"error": "seeker_profile must be an object"}), 400
    if not isinstance(jobs, list):
        return jsonify({"error": "jobs must be an array"}), 400

    limit = body.get("limit", 10)
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 10
    limit = max(1, min(limit, 50))

    result = recommend_from_profile_and_jobs(seeker_profile, jobs, limit=limit)
    if result.get("error") and not result.get("recommendations"):
        return jsonify(result), 400
    return jsonify(result), 200


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
