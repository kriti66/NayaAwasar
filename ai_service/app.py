from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        user_profile_text = data.get('user_profile_text', '')
        jobs = data.get('jobs', [])

        if not user_profile_text or not jobs:
            return jsonify([])

        # Prepare corpus: User Profile + Job Descriptions
        # Jobs should be a list of { id, text(title+desc+skills) }
        
        job_texts = [job.get('text', '') for job in jobs]
        all_texts = [user_profile_text] + job_texts

        # Vectorize
        tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf_vectorizer.fit_transform(all_texts)

        # Calculate Cosine Similarity
        # user vector is at index 0
        cosine_similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

        # Get top matches
        # Sort indices by score descending
        related_docs_indices = cosine_similarities.argsort()[::-1]

        recommendations = []
        feature_names = np.array(tfidf_vectorizer.get_feature_names_out())
        user_vector_dense = tfidf_matrix[0].todense().A1
        
        for i in related_docs_indices:
            score = cosine_similarities[i]
            if score > 0.05: # Minimum threshold
                job = jobs[i]
                
                # Extract reason (top matching keywords)
                job_vector_dense = tfidf_matrix[i+1].todense().A1
                
                # Element-wise product to find common terms contribution
                match_scores = np.multiply(user_vector_dense, job_vector_dense)
                top_keyword_indices = match_scores.argsort()[::-1][:3] # Top 3 keywords
                top_keywords = feature_names[top_keyword_indices]
                
                # Filter out zero scores
                valid_keywords = [kw for idx, kw in enumerate(top_keywords) if match_scores[top_keyword_indices[idx]] > 0]
                
                reason = "Matched based on profile."
                if valid_keywords:
                    reason = f"Matched because you have {', '.join(valid_keywords)} related skills."

                recommendations.append({
                    "job_id": job.get('id'),
                    "score": float(score),
                    "reason": reason
                })

                if len(recommendations) >= 5:
                    break
        
        # Always return valid recommendations regardless of threshold here, filter in Node
        
        return jsonify(recommendations)

    except Exception as e:
        logging.error(f"Error in recommendation: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5002, debug=True)
