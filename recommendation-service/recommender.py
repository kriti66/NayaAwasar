from collections import Counter, defaultdict
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
    u_skills = list(user.get("skills") or [])
    p_skills: List[str] = []
    if profile and isinstance(profile, dict):
        p_skills = list(profile.get("skills") or [])
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
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from embeddings import build_job_text, build_user_text, get_or_create_embedding

    db = get_db()
    user_oid = ObjectId(user_id)
    user = await db["users"].find_one({"_id": user_oid})
    if not user:
        return []
    profile = await db["profiles"].find_one({"userId": user_oid})
    user_text = build_user_text(user, profile)
    user_emb = await get_or_create_embedding(user_id, user_text, "user")
    user_skills = _user_skill_list(user, profile)

    applied_ids = await _fetch_applied_job_ids(user_oid)

    cursor = db["jobs"].find(_job_match_filter())
    jobs: List[Dict[str, Any]] = []
    embeddings: List[List[float]] = []
    async for job in cursor:
        jid = str(job["_id"])
        if jid in applied_ids:
            continue
        jt = build_job_text(job)
        je = await get_or_create_embedding(jid, jt, "job")
        jobs.append(job)
        embeddings.append(je)

    if not jobs:
        return []

    u = np.array(user_emb, dtype=np.float64).reshape(1, -1)
    m = np.array(embeddings, dtype=np.float64)
    sims = cosine_similarity(u, m)[0]

    ranked: List[Tuple[float, Dict[str, Any], str]] = []
    for idx, job in enumerate(jobs):
        score = float(max(0.0, min(1.0, sims[idx])))
        jt_lower = build_job_text(job).lower()
        matched = _top_matching_skills(user_skills, job, jt_lower)
        if matched:
            reason = f"Matches your {', '.join(matched[:3])}"
        else:
            reason = "Matches your profile and preferences"
        ranked.append((score, job, reason))

    ranked.sort(key=lambda x: x[0], reverse=True)
    out: List[Dict[str, Any]] = []
    for score, job, reason in ranked[:top_n]:
        out.append(_job_to_rec(job, score, reason))

    # Release large arrays/matrices aggressively on low-memory hosts.
    del u
    del m
    del sims
    del embeddings
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
