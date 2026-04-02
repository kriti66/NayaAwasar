import re
from typing import Optional, Set

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId

# Must match backend JOB_CATEGORIES / recommendationFallback.js intent
_CANONICAL_CATEGORIES = frozenset({"Health", "Education", "IT", "Finance", "Engineering", "Government"})

TITLE_KEYWORD_RULES = [
    (
        [
            "engineer",
            "developer",
            "software",
            "programmer",
            "devops",
            "full stack",
            "fullstack",
            "frontend",
            "backend",
            "web dev",
            "data scientist",
            "analyst",
            "coding",
            "react",
            "node",
            "python",
        ],
        ["IT", "Engineering"],
    ),
    (
        ["doctor", "nurse", "medical", "health", "clinical", "surgeon", "patient", "hospital"],
        ["Health"],
    ),
    (
        ["teacher", "instructor", "tutor", "education", "lecturer", "school", "principal"],
        ["Education"],
    ),
    (["accountant", "finance", "banking", "audit", "cfo", "investment"], ["Finance"]),
    (["designer", "ux", "ui", "graphic", "creative"], ["IT", "Engineering"]),
    (
        ["manager", "admin", "operations", "business", "hr", "human resource", "supervisor"],
        ["Finance", "Government", "Engineering", "IT"],
    ),
]


def infer_allowed_categories(seeker_profile: dict) -> Optional[Set[str]]:
    """None = do not filter. Empty set should not happen; None if no keyword hit."""
    blob = " ".join(
        [
            str(seeker_profile.get("jobTitle") or ""),
            str(seeker_profile.get("professionalHeadline") or ""),
            str(seeker_profile.get("headline") or ""),
        ]
    ).lower()
    if not blob.strip():
        return None
    allowed = set()
    for keywords, cats in TITLE_KEYWORD_RULES:
        if any(kw in blob for kw in keywords):
            for c in cats:
                if c in _CANONICAL_CATEGORIES:
                    allowed.add(c)
    if not allowed:
        return None
    return allowed


def build_job_text(job):
    """Combine job fields into a single text document for TF-IDF."""
    title = job.get("job_title") or job.get("title", "")
    desc = job.get("job_description") or job.get("description", "")
    reqs = job.get("requirements", "") or ""
    company = job.get("company_name", "") or ""
    location = job.get("location", "") or ""
    job_type = job.get("job_type") or job.get("type", "")
    category = job.get("category", "") or ""
    tags = job.get("tags") or []
    exp = job.get("experience_level", "") or ""
    tag_str = " ".join(tags) if isinstance(tags, list) else str(tags)
    req_skills = job.get("requiredSkills") or []
    if isinstance(req_skills, list):
        skills_str = " ".join(str(s) for s in req_skills if s)
    else:
        skills_str = str(req_skills)
    components = [
        str(x)
        for x in [title, desc, reqs, company, location, job_type, category, tag_str, exp, skills_str]
        if x
    ]
    return " ".join(components).lower()


def build_user_text(user, profile=None):
    """Combine user and profile fields (legacy Mongo path)."""
    text_components = []
    if user.get("userProfileText"):
        text_components.append(user["userProfileText"])
    else:
        if user.get("professionalHeadline"):
            text_components.append(user["professionalHeadline"])
        if user.get("bio"):
            text_components.append(user["bio"])
        if user.get("skills"):
            skills = user["skills"]
            if isinstance(skills, list):
                text_components.append(" ".join(skills))
            elif isinstance(skills, str):
                text_components.append(skills)
    if profile:
        if profile.get("headline"):
            text_components.append(profile["headline"])
        if profile.get("summary"):
            text_components.append(profile["summary"])
        if profile.get("skills"):
            text_components.append(
                " ".join(profile["skills"]) if isinstance(profile["skills"], list) else str(profile["skills"])
            )
    return " ".join([str(x) for x in text_components if x]).lower()


def build_seeker_text_from_payload(seeker: dict) -> str:
    """Flatten seeker_profile JSON from Express into one document for TF-IDF."""
    parts = []
    jt = seeker.get("jobTitle")
    if jt:
        parts.append(str(jt).lower())
    for key in ("userProfileText", "cvText", "professionalHeadline", "bio", "headline", "summary"):
        v = seeker.get(key)
        if v:
            parts.append(str(v))
    skills = seeker.get("skills")
    if isinstance(skills, list):
        parts.append(" ".join(str(s) for s in skills if s))
    elif skills:
        parts.append(str(skills))
    ps = seeker.get("profileSkills")
    if isinstance(ps, list):
        parts.append(" ".join(str(s) for s in ps if s))
    elif ps:
        parts.append(str(ps))
    if seeker.get("location"):
        parts.append(str(seeker["location"]))
    if seeker.get("profileLocation"):
        parts.append(str(seeker["profileLocation"]))
    jp = seeker.get("jobPreferences") or {}
    if isinstance(jp, dict):
        for k in ("seniority", "location", "workMode", "jobType"):
            if jp.get(k):
                parts.append(str(jp[k]))
    pjp = seeker.get("profileJobPreferences") or {}
    if isinstance(pjp, dict):
        for k in ("seniority", "preferredLocation"):
            if pjp.get(k):
                parts.append(str(pjp[k]))
        jts = pjp.get("jobTypes")
        if isinstance(jts, list):
            parts.append(" ".join(str(x) for x in jts if x))
    for we in seeker.get("workExperience") or []:
        if isinstance(we, dict):
            for k in ("title", "company", "description"):
                if we.get(k):
                    parts.append(str(we[k]))
    for ed in seeker.get("education") or []:
        if isinstance(ed, dict):
            for k in ("degree", "institution"):
                if ed.get(k):
                    parts.append(str(ed[k]))
    for proj in seeker.get("projects") or []:
        if isinstance(proj, dict):
            if proj.get("title"):
                parts.append(str(proj["title"]))
            if proj.get("description"):
                parts.append(str(proj["description"]))
            ts = proj.get("techStack")
            if isinstance(ts, list):
                parts.append(" ".join(str(t) for t in ts if t))
    for wt in seeker.get("workExperienceTitles") or []:
        if wt:
            parts.append(str(wt).lower())
    return " ".join(parts).lower()


def _norm_exp(s):
    if not s:
        return ""
    t = str(s).lower().replace("-", " ").replace("_", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _experience_aligns(seeker_seniority: str, job_level: str) -> bool:
    su = _norm_exp(seeker_seniority)
    jl = _norm_exp(job_level)
    if not su or not jl:
        return False
    pairs = [
        ("entry", "entry"),
        ("junior", "entry"),
        ("mid", "mid"),
        ("middle", "mid"),
        ("senior", "senior"),
        ("lead", "senior"),
        ("executive", "executive"),
        ("director", "executive"),
    ]
    for a, b in pairs:
        if a in su and b in jl:
            return True
        if b in su and a in jl:
            return True
    return su in jl or jl in su


def _location_matches(seeker: dict, job: dict) -> bool:
    jloc = (job.get("location") or "").lower().strip()
    if not jloc:
        return False
    candidates = []
    if seeker.get("location"):
        candidates.append(str(seeker["location"]).lower().strip())
    if seeker.get("profileLocation"):
        candidates.append(str(seeker["profileLocation"]).lower().strip())
    jp = seeker.get("jobPreferences") or {}
    if isinstance(jp, dict) and jp.get("location"):
        candidates.append(str(jp["location"]).lower().strip())
    pjp = seeker.get("profileJobPreferences") or {}
    if isinstance(pjp, dict) and pjp.get("preferredLocation"):
        candidates.append(str(pjp["preferredLocation"]).lower().strip())
    for c in candidates:
        if len(c) < 2:
            continue
        if c in jloc or jloc in c:
            return True
        for token in re.split(r"[,/]|(?:\s+)", c):
            token = token.strip()
            if len(token) >= 3 and token in jloc:
                return True
    return False


def _type_matches(seeker: dict, job: dict) -> bool:
    jt = (job.get("job_type") or job.get("type") or "").strip().lower()
    if not jt:
        return False
    jp = seeker.get("jobPreferences") or {}
    if isinstance(jp, dict) and jp.get("jobType"):
        if str(jp["jobType"]).lower().strip() in jt or jt in str(jp["jobType"]).lower():
            return True
    pjp = seeker.get("profileJobPreferences") or {}
    if isinstance(pjp, dict):
        for x in pjp.get("jobTypes") or []:
            if x and (str(x).lower().strip() in jt or jt in str(x).lower()):
                return True
    return False


def get_explanation_and_skills(user_text, job_text, vectorizer):
    user_words = set(user_text.split())
    job_words = set(job_text.split())
    vocab = vectorizer.vocabulary_
    user_meaningful = [w for w in user_words if w in vocab]
    job_meaningful = [w for w in job_words if w in vocab]
    matched_skills = list(set(user_meaningful).intersection(set(job_meaningful)))
    missing_skills = list(set(job_meaningful) - set(user_meaningful))
    matched_sample = matched_skills[:5] if len(matched_skills) > 5 else matched_skills
    missing_sample = missing_skills[:3] if len(missing_skills) > 3 else missing_skills
    reason = "Matched based on overall profile."
    if matched_sample:
        reason = f"Your profile strongly matches the following job requirements: {', '.join(matched_sample)}."
    return matched_sample, missing_sample, reason


def compose_match_reason(seeker: dict, job: dict, job_text_blob: str, matched_vocab_tokens: list) -> str:
    """Human-readable bullets for the dashboard."""
    parts = []
    job_blob = (job_text_blob or "").lower()
    named = []
    for src in (seeker.get("skills"), seeker.get("profileSkills")):
        if isinstance(src, list):
            for s in src:
                if not s:
                    continue
                sl = str(s).strip()
                if len(sl) >= 2 and sl.lower() in job_blob:
                    if sl not in named:
                        named.append(sl)
        elif src:
            sl = str(src).strip()
            if len(sl) >= 2 and sl.lower() in job_blob:
                named.append(sl)
    if named:
        show = named[:8]
        parts.append(f"Matches your skills: {', '.join(show)}")

    cat = job.get("category") or ""
    if cat and str(cat).strip():
        parts.append(f"Same career field ({str(cat).strip()})")

    seniority = None
    jp = seeker.get("jobPreferences") or {}
    pjp = seeker.get("profileJobPreferences") or {}
    if isinstance(jp, dict) and jp.get("seniority"):
        seniority = jp["seniority"]
    if isinstance(pjp, dict) and pjp.get("seniority"):
        seniority = seniority or pjp["seniority"]
    jlevel = job.get("experience_level") or ""
    if seniority and jlevel and _experience_aligns(seniority, jlevel):
        parts.append(f"Matches your experience level: {jlevel}")

    if _location_matches(seeker, job):
        parts.append("Matches your location preference")

    if _type_matches(seeker, job):
        jt = job.get("job_type") or job.get("type") or "this role type"
        parts.append(f"Aligns with your preferred job type ({jt})")

    if not parts and matched_vocab_tokens:
        clean = [t for t in matched_vocab_tokens[:6] if len(str(t)) > 2]
        if clean:
            parts.append(f"Strong keyword overlap: {', '.join(clean)}")

    if not parts:
        parts.append("High similarity between your profile text and this job description")

    return " | ".join(parts)


def recommend_from_profile_and_jobs(seeker_profile: dict, jobs: list, limit: int = 10):
    """
    TF-IDF + cosine similarity: first document = seeker text, rest = jobs.
    Filters jobs by seeker career field vs job category when inferable.
    """
    if not seeker_profile:
        return {"error": "Missing seeker profile", "recommendations": []}
    user_text = build_seeker_text_from_payload(seeker_profile)
    if not user_text.strip():
        return {"error": "Seeker profile has insufficient text for matching.", "recommendations": []}

    if not jobs:
        return {"error": "No jobs provided", "recommendations": []}

    allowed_cats = infer_allowed_categories(seeker_profile)
    if allowed_cats is not None:
        jobs = [j for j in jobs if j.get("category") in allowed_cats]
    if not jobs:
        return {
            "error": "No jobs in your field match the category filter. Broaden your profile title or check listings later.",
            "recommendations": [],
        }

    job_texts = [build_job_text(j) for j in jobs]
    all_texts = [user_text] + job_texts

    vectorizer = TfidfVectorizer(stop_words="english", min_df=1, max_features=8000)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return {"error": "Not enough vocabulary to compute recommendations.", "recommendations": []}

    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    related_docs_indices = cosine_sim.argsort()[::-1]

    recommendations = []
    for i in related_docs_indices:
        if len(recommendations) >= limit:
            break
        score = float(cosine_sim[i])
        job = jobs[i]
        jid = job.get("_id") or job.get("id")
        if jid is None:
            continue
        matched_vocab, _, _ = get_explanation_and_skills(user_text, job_texts[i], vectorizer)
        reason = compose_match_reason(seeker_profile, job, job_texts[i], matched_vocab)
        sim = round(min(1.0, max(0.0, score)), 6)
        jid_str = str(jid)
        recommendations.append(
            {
                "jobId": jid_str,
                "similarityScore": sim,
                "matchReason": reason,
                "job_id": jid_str,
                "similarity_score": sim,
                "reason": reason,
            }
        )

    return {"recommendations": recommendations, "total": len(recommendations)}


def recommend_jobs_for_user(user_id, db):
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"error": "User not found"}

    profile = db["profiles"].find_one({"userId": ObjectId(user_id)})

    user_text = build_user_text(user, profile)
    if not user_text.strip():
        return {"error": "User profile lacks sufficient text for recommendation."}

    jobs = list(db["jobs"].find({"status": "Active"}))
    if not jobs:
        return {"error": "No active jobs found"}

    applied_apps = list(db["applications"].find({"seeker_id": ObjectId(user_id)}))
    applied_job_ids = [str(app.get("job_id")) for app in applied_apps if app.get("job_id")]

    candidate_jobs = [job for job in jobs if str(job["_id"]) not in applied_job_ids]
    if not candidate_jobs:
        return {"error": "No new jobs available to recommend (already applied to all active jobs)."}

    job_texts = [build_job_text(job) for job in candidate_jobs]
    all_texts = [user_text] + job_texts

    vectorizer = TfidfVectorizer(stop_words="english", min_df=1)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return {"error": "Not enough vocabulary to compute recommendations."}

    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    related_docs_indices = cosine_sim.argsort()[::-1]

    recommendations = []
    for i in related_docs_indices:
        score = float(cosine_sim[i])
        if score > 0.05:
            job = candidate_jobs[i]
            matched, missing, reason = get_explanation_and_skills(user_text, job_texts[i], vectorizer)

            job_dict = {
                "job_id": str(job["_id"]),
                "title": job.get("job_title", job.get("title", "")),
                "company": job.get("company_name", "Unknown"),
                "location": job.get("location", "Remote"),
                "type": job.get("job_type", job.get("type", "Full-time")),
                "salary_range": job.get("salary_range", "Not disclosed"),
                "posted_date": str(job.get("posted_date", str(job.get("createdAt", "")))),
                "match_score": round(score * 100, 2),
                "matched_skills": matched,
                "missing_skills": missing,
                "explanation": reason,
            }
            recommendations.append(job_dict)
            if len(recommendations) >= 10:
                break

    return {"jobs": recommendations, "count": len(recommendations)}


def recommend_candidates_for_job(job_id, db):
    job = db["jobs"].find_one({"_id": ObjectId(job_id)})
    if not job:
        return {"error": "Job not found"}

    job_text = build_job_text(job)
    if not job_text.strip():
        return {"error": "Job lacks sufficient text for recommendation."}

    users_cursor = db["users"].find({"role": "jobseeker"})
    candidate_users = []
    user_texts = []

    for u in users_cursor:
        profile = db["profiles"].find_one({"userId": u["_id"]})
        text = build_user_text(u, profile)
        if text.strip():
            candidate_users.append(u)
            user_texts.append(text)

    if not candidate_users:
        return {"error": "No candidates found."}

    all_texts = [job_text] + user_texts

    vectorizer = TfidfVectorizer(stop_words="english", min_df=1)
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return {"error": "Not enough vocabulary to compute recommendations."}

    cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    related_docs_indices = cosine_sim.argsort()[::-1]

    recommendations = []
    for i in related_docs_indices:
        score = float(cosine_sim[i])
        if score > 0.05:
            user = candidate_users[i]
            matched, missing, reason = get_explanation_and_skills(user_texts[i], job_text, vectorizer)

            reason = "Candidate matches overall job profile."
            if matched:
                reason = f"Candidate possesses the following required skills: {', '.join(matched)}."

            user_dict = {
                "user_id": str(user["_id"]),
                "full_name": user.get("fullName", "Unknown Candidate"),
                "headline": user.get("professionalHeadline", ""),
                "location": user.get("location", "Remote"),
                "email": user.get("email", ""),
                "match_score": round(score * 100, 2),
                "matched_skills": matched,
                "missing_skills": missing,
                "explanation": reason,
            }
            recommendations.append(user_dict)
            if len(recommendations) >= 10:
                break

    return {"candidates": recommendations, "count": len(recommendations)}
