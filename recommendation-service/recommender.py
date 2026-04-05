from collections import Counter, defaultdict
import re
from typing import Any, Dict, List, Set, Tuple
import gc

from bson import ObjectId
from database import get_db


def _job_match_filter() -> Dict[str, Any]:
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    return {
        "$and": [
            {"status": "Active"},
            {
                "$or": [
                    {"moderationStatus": "Approved"},
                    {"moderationStatus": "approved"},
                    {"moderationStatus": "Active"},
                    {"moderationStatus": "active"},
                    {"moderationStatus": {"$exists": False}},
                ]
            },
            {
                "$or": [
                    {"application_deadline": {"$exists": False}},
                    {"application_deadline": {"$gte": now}},
                ]
            },
        ]
    }


def _user_skill_list(user: Dict[str, Any], profile: Any) -> List[str]:
    def _flatten_skills(raw: Any) -> List[str]:
        out: List[str] = []
        if raw is None:
            return out
        if isinstance(raw, str):
            out.extend([s.strip() for s in raw.split(",") if s.strip()])
            return out
        if isinstance(raw, list):
            for item in raw:
                if isinstance(item, str):
                    t = item.strip()
                    if t:
                        out.append(t)
                elif isinstance(item, dict):
                    for key in ("name", "skill", "title", "label", "value"):
                        val = item.get(key)
                        if isinstance(val, str) and val.strip():
                            out.append(val.strip())
                            break
            return out
        if isinstance(raw, dict):
            for val in raw.values():
                out.extend(_flatten_skills(val))
        return out

    u_skills = _flatten_skills(user.get("skills"))
    u_skills.extend(_flatten_skills(user.get("coreSkills")))
    u_skills.extend(_flatten_skills(user.get("skillSet")))
    u_skills.extend(_flatten_skills(user.get("technicalSkills")))

    p_skills: List[str] = []
    if profile and isinstance(profile, dict):
        p_skills.extend(_flatten_skills(profile.get("skills")))
        p_skills.extend(_flatten_skills(profile.get("coreSkills")))
        p_skills.extend(_flatten_skills(profile.get("skillSet")))
        p_skills.extend(_flatten_skills(profile.get("technicalSkills")))
        p_skills.extend(_flatten_skills((profile.get("preferences") or {}).get("skills")))

    merged = []
    seen = set()
    for s in u_skills + p_skills:
        t = str(s).strip()
        if not t:
            continue
        low = t.lower()
        if low not in seen:
            seen.add(low)
            merged.append(t)
    return merged


def _top_matching_skills(user_skills: List[str], job: Dict[str, Any], job_text_lower: str) -> List[str]:
    matched: List[str] = []
    tags_lower = [str(t).lower() for t in (job.get("tags") or [])]
    for s in user_skills:
        sl = s.lower()
        if sl in job_text_lower or sl in tags_lower:
            matched.append(s)
        elif any(sl in tag or tag in sl for tag in tags_lower):
            matched.append(s)
    return matched[:5]


def _job_to_rec(
    job: Dict[str, Any],
    score: float,
    reason: str,
) -> Dict[str, Any]:
    jid = str(job["_id"])
    return {
        "job_id": jid,
        "title": job.get("title") or job.get("job_title") or "Role",
        "company": job.get("company_name") or "",
        "location": job.get("location") or "",
        "salary": job.get("salary_range"),
        "similarity_score": float(score),
        "reason": reason,
    }


def _normalize_skill_tokens(values: List[str]) -> Set[str]:
    out: Set[str] = set()
    for v in values:
        t = str(v).strip().lower()
        if not t:
            continue
        out.add(t)
        for part in re.split(r"[,/]|(?:\s+)", t):
            p = part.strip()
            if len(p) >= 2:
                out.add(p)
    return out


def _extract_seeker_skills_from_payload(seeker_profile: Dict[str, Any]) -> List[str]:
    skills: List[str] = []
    for key in ("skills", "profileSkills"):
        raw = seeker_profile.get(key)
        if isinstance(raw, list):
            for s in raw:
                if s:
                    skills.append(str(s).strip())
        elif isinstance(raw, str) and raw.strip():
            skills.extend([x.strip() for x in raw.split(",") if x.strip()])
    return [s for s in skills if s]


def _build_job_blob_from_payload(job: Dict[str, Any]) -> str:
    parts = [
        job.get("title"),
        job.get("job_title"),
        job.get("description"),
        job.get("job_description"),
        job.get("requirements"),
        job.get("company_name"),
        job.get("location"),
        job.get("type"),
        job.get("job_type"),
        job.get("experience_level"),
        job.get("category"),
    ]
    tags = job.get("tags") or []
    if isinstance(tags, list):
        parts.extend([str(x) for x in tags if x])
    req_skills = job.get("requiredSkills") or []
    if isinstance(req_skills, list):
        parts.extend([str(x) for x in req_skills if x])
    return " ".join(str(x) for x in parts if x).lower()


def recommend_from_payload(
    user_id: str,
    seeker_profile: Dict[str, Any],
    jobs: List[Dict[str, Any]],
    top_n: int = 10,
) -> List[Dict[str, Any]]:
    if not seeker_profile or not isinstance(seeker_profile, dict):
        return []
    if not jobs or not isinstance(jobs, list):
        return []

    seeker_skill_values = _extract_seeker_skills_from_payload(seeker_profile)
    seeker_tokens = _normalize_skill_tokens(seeker_skill_values)
    if not seeker_tokens:
        return []

    ranked: List[Tuple[float, Dict[str, Any], str]] = []
    for job in jobs:
        if not isinstance(job, dict):
            continue
        blob = _build_job_blob_from_payload(job)
        if not blob.strip():
            continue

        matched: List[str] = []
        for sk in seeker_skill_values:
            s = sk.lower()
            if s and s in blob:
                matched.append(sk)

        score = min(1.0, 0.18 * len(set(x.lower() for x in matched)))
        if score <= 0:
            continue

        reason_skills = matched[:3]
        reason = (
            f"Matched with your skills: {', '.join(reason_skills)}"
            if reason_skills
            else "Matched based on your profile and job content overlap"
        )
        ranked.append((score, job, reason))

    ranked.sort(key=lambda x: x[0], reverse=True)
    out: List[Dict[str, Any]] = []
    for score, job, reason in ranked[:top_n]:
        jid = job.get("_id") or job.get("id")
        if jid is None:
            continue
        out.append(
            {
                "job_id": str(jid),
                "title": job.get("title") or job.get("job_title") or "Role",
                "company": job.get("company_name") or "",
                "location": job.get("location") or "",
                "salary": job.get("salary_range"),
                "similarity_score": float(score),
                "reason": reason,
            }
        )
    return out


async def _fetch_applied_job_ids(user_oid: ObjectId) -> Set[str]:
    db = get_db()
    cursor = db["applications"].find(
        {"seeker_id": user_oid},
        {"job_id": 1},
    )
    out: Set[str] = set()
    async for doc in cursor:
        jid = doc.get("job_id")
        if jid is not None:
            out.add(str(jid))
    return out


async def _fetch_my_interaction_jobs(user_oid: ObjectId) -> Set[str]:
    applied = await _fetch_applied_job_ids(user_oid)
    db = get_db()
    user = await db["users"].find_one({"_id": user_oid}, {"savedJobs": 1})
    if user and user.get("savedJobs"):
        for sj in user["savedJobs"]:
            applied.add(str(sj))
    cursor = db["user_interactions"].find(
        {"user_id": user_oid, "action": {"$in": ["applied", "saved", "viewed"]}},
        {"job_id": 1},
    )
    async for doc in cursor:
        if doc.get("job_id") is not None:
            applied.add(str(doc["job_id"]))
    return applied


async def content_based_recommend(user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
    db = get_db()
    user_oid = ObjectId(user_id)
    user = await db["users"].find_one({"_id": user_oid})
    if not user:
        return []
    profile = await db["profiles"].find_one({"userId": user_oid})
    print("user_keys:", sorted(list(user.keys())))
    print("profile_keys:", sorted(list((profile or {}).keys())))
    user_skills = _user_skill_list(user, profile)
    print("user_skills:", user_skills)
    user_skills_lower = [s.lower() for s in user_skills if str(s).strip()]
    professional_headline = str(user.get("professionalHeadline") or "").strip()
    profile_headline = str((profile or {}).get("headline") or "").strip()
    headline_words = [
        w.lower()
        for w in f"{professional_headline} {profile_headline}".split()
        if w.strip()
    ]
    preferred_category = str(
        (profile or {}).get("preferredCategory")
        or (profile or {}).get("category")
        or ((profile or {}).get("jobPreferences") or {}).get("category")
        or ""
    ).strip().lower()

    user_prefs = user.get("jobPreferences") or user.get("preferences") or {}
    profile_prefs = (profile or {}).get("jobPreferences") or (profile or {}).get("preferences") or {}
    preferred_location = str(
        user_prefs.get("location")
        or user.get("preferredLocation")
        or profile_prefs.get("preferredLocation")
        or profile_prefs.get("location")
        or (profile or {}).get("location")
        or ""
    ).strip().lower()
    preferred_job_type = str(
        user_prefs.get("jobType")
        or user_prefs.get("preferredJobType")
        or (profile_prefs.get("jobTypes") or [""])[0]
        or profile_prefs.get("jobType")
        or ""
    ).strip().lower()
    preferred_seniority = str(
        user_prefs.get("seniority")
        or user_prefs.get("experienceLevel")
        or profile_prefs.get("seniority")
        or profile_prefs.get("experienceLevel")
        or ""
    ).strip().lower()

    applied_ids = await _fetch_applied_job_ids(user_oid)

    cursor = db["jobs"].find(_job_match_filter())
    ranked: List[Tuple[float, Dict[str, Any], str]] = []
    async for job in cursor:
        jid = str(job["_id"])
        if jid in applied_ids:
            continue
        title = str(job.get("title") or job.get("job_title") or "")
        description = str(job.get("description") or job.get("job_description") or "")
        requirements = str(job.get("requirements") or "")
        tags = " ".join(str(t) for t in (job.get("tags") or []))
        searchable = f"{title} {description} {requirements} {tags}".lower()

        matched_skills: List[str] = []
        for idx, skill in enumerate(user_skills_lower):
            if skill and skill in searchable:
                matched_skills.append(user_skills[idx])

        score = min(1.0, 0.2 * len(matched_skills))

        title_desc = f"{title} {description}".lower()
        headline_match_count = 0
        for word in headline_words:
            if word and word in title_desc:
                headline_match_count += 1
        score += 0.15 * headline_match_count

        job_category = str(job.get("category") or "").strip().lower()
        if preferred_category and job_category and (
            preferred_category == job_category
            or preferred_category in job_category
            or job_category in preferred_category
        ):
            score += 0.2

        job_location = str(job.get("location") or "").strip().lower()
        if preferred_location and job_location and (
            preferred_location in job_location or job_location in preferred_location
        ):
            score += 0.1

        job_type = str(job.get("type") or job.get("job_type") or "").strip().lower()
        if preferred_job_type and job_type and (
            preferred_job_type in job_type or job_type in preferred_job_type
        ):
            score += 0.1

        job_experience = str(job.get("experience_level") or "").strip().lower()
        if preferred_seniority and job_experience and (
            preferred_seniority in job_experience or job_experience in preferred_seniority
        ):
            score += 0.1

        score = float(min(1.0, score))
        if score <= 0:
            continue

        reason_skills = matched_skills[:2]
        reason = f"Matched because you have [{', '.join(reason_skills)}] related skills"
        ranked.append((score, job, reason))

    ranked.sort(key=lambda x: x[0], reverse=True)
    out: List[Dict[str, Any]] = []
    for score, job, reason in ranked[:top_n]:
        out.append(_job_to_rec(job, score, reason))

    gc.collect()
    return out


async def collaborative_recommend(user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
    db = get_db()
    user_oid = ObjectId(user_id)
    my_jobs = await _fetch_my_interaction_jobs(user_oid)
    if not my_jobs:
        return []

    my_job_oids = [ObjectId(j) for j in my_jobs]

    cursor = db["applications"].find(
        {"job_id": {"$in": my_job_oids}, "seeker_id": {"$ne": user_oid}},
        {"seeker_id": 1, "job_id": 1},
    )
    other_user_jobs: Dict[str, Set[str]] = defaultdict(set)
    async for doc in cursor:
        sid = doc.get("seeker_id")
        jid = doc.get("job_id")
        if sid is None or jid is None:
            continue
        other_user_jobs[str(sid)].add(str(jid))

    scores: Counter[str] = Counter()
    for _uid, jset in other_user_jobs.items():
        for jid in jset:
            if jid not in my_jobs:
                scores[jid] += 1

    if not scores:
        return []

    max_c = max(scores.values()) or 1
    ranked_ids = [jid for jid, _ in scores.most_common(top_n * 3)]

    jobs_by_id: Dict[str, Dict[str, Any]] = {}
    match = _job_match_filter()
    for jid in ranked_ids:
        try:
            job = await db["jobs"].find_one({"$and": [{"_id": ObjectId(jid)}, match]})
        except Exception:
            job = None
        if job:
            jobs_by_id[jid] = job

    out: List[Dict[str, Any]] = []
    for jid in ranked_ids:
        if len(out) >= top_n:
            break
        job = jobs_by_id.get(jid)
        if not job:
            continue
        norm = scores[jid] / max_c
        out.append(
            _job_to_rec(
                job,
                norm,
                "Popular among users with similar profiles",
            )
        )
    return out


def _normalize_scores(items: List[Dict[str, Any]]) -> None:
    if not items:
        return
    vals = [float(i["similarity_score"]) for i in items]
    lo, hi = min(vals), max(vals)
    if hi - lo < 1e-9:
        for i in items:
            i["similarity_score"] = 1.0
        return
    for i in items:
        i["similarity_score"] = (float(i["similarity_score"]) - lo) / (hi - lo)


async def hybrid_recommend(user_id: str, top_n: int = 10) -> List[Dict[str, Any]]:
    content = await content_based_recommend(user_id, top_n=30)
    collab = await collaborative_recommend(user_id, top_n=30)

    _normalize_scores(content)
    _normalize_scores(collab)

    merged: Dict[str, Dict[str, Any]] = {}
    for c in content:
        jid = c["job_id"]
        merged[jid] = {
            **c,
            "_c": float(c["similarity_score"]),
            "_b": 0.0,
        }
    for b in collab:
        jid = b["job_id"]
        if jid in merged:
            merged[jid]["_b"] = float(b["similarity_score"])
            if b.get("reason"):
                merged[jid]["reason"] = merged[jid].get("reason") or b["reason"]
        else:
            merged[jid] = {
                **b,
                "_c": 0.0,
                "_b": float(b["similarity_score"]),
            }

    finals: List[Dict[str, Any]] = []
    for jid, row in merged.items():
        fin = 0.6 * row["_c"] + 0.4 * row["_b"]
        rec = {k: v for k, v in row.items() if not k.startswith("_")}
        rec["similarity_score"] = float(fin)
        finals.append(rec)

    finals.sort(key=lambda x: x["similarity_score"], reverse=True)
    if not finals:
        db = get_db()
        cursor = db["jobs"].find(_job_match_filter()).sort("createdAt", -1).limit(top_n)
        fallback: List[Dict[str, Any]] = []
        async for job in cursor:
            fallback.append(
                _job_to_rec(
                    job,
                    0.1,
                    "Recommended for you based on available opportunities",
                )
            )
        return fallback
    return finals[:top_n]


async def get_similar_jobs(job_id: str, top_n: int = 5) -> List[Dict[str, Any]]:
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from embeddings import build_job_text, get_or_create_embedding

    db = get_db()
    try:
        src = await db["jobs"].find_one({"_id": ObjectId(job_id)})
    except Exception:
        src = None
    if not src:
        return []

    src_text = build_job_text(src)
    src_emb = await get_or_create_embedding(job_id, src_text, "job")

    cursor = db["jobs"].find(_job_match_filter())
    jobs: List[Dict[str, Any]] = []
    embeddings: List[List[float]] = []
    async for job in cursor:
        jid = str(job["_id"])
        if jid == job_id:
            continue
        jt = build_job_text(job)
        je = await get_or_create_embedding(jid, jt, "job")
        jobs.append(job)
        embeddings.append(je)

    if not jobs:
        return []

    u = np.array(src_emb, dtype=np.float64).reshape(1, -1)
    m = np.array(embeddings, dtype=np.float64)
    sims = cosine_similarity(u, m)[0]

    ranked = sorted(
        zip(sims.tolist(), jobs),
        key=lambda x: x[0],
        reverse=True,
    )[:top_n]

    result = [
        _job_to_rec(job, float(max(0.0, min(1.0, score))), "Similar role and requirements")
        for score, job in ranked
    ]

    # Release large arrays/matrices aggressively on low-memory hosts.
    del u
    del m
    del sims
    del embeddings
    gc.collect()
    return result
