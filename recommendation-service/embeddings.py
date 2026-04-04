import hashlib
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from database import get_db

load_dotenv()

_model: Optional[SentenceTransformer] = None


def load_model() -> None:
    """Called at lifespan startup — now a no-op. Model loads lazily on first use."""
    pass


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        name = os.getenv("MODEL_NAME", "all-MiniLM-L6-v2")
        _model = SentenceTransformer(name)  # loads on first actual request
    return _model


def is_model_loaded() -> bool:
    return _model is not None


def generate_embedding(text: str) -> List[float]:
    raw = (text or "").strip() or " "
    vec = get_model().encode(raw, convert_to_numpy=True, normalize_embeddings=True)
    return [float(x) for x in vec.tolist()]


def hash_text(text: str) -> str:
    return hashlib.md5((text or "").encode("utf-8"), usedforsecurity=False).hexdigest()


def build_job_text(job: Dict[str, Any]) -> str:
    parts = [
        job.get("title") or "",
        job.get("job_title") or "",
        job.get("description") or "",
        job.get("job_description") or "",
        job.get("requirements") or "",
        job.get("location") or "",
        job.get("experience_level") or "",
        job.get("category") or "",
        " ".join(job.get("tags") or []),
    ]
    return " ".join(p for p in parts if p).strip() or " "


def build_user_text(user: Dict[str, Any], profile: Optional[Dict[str, Any]]) -> str:
    skills_user = user.get("skills") or []
    exp_user = user.get("workExperience") or []
    exp_lines = []
    for e in exp_user:
        if isinstance(e, dict):
            exp_lines.append(
                " ".join(
                    str(e.get(k) or "")
                    for k in ("title", "company", "duration", "description")
                )
            )
    prefs = user.get("jobPreferences") or {}
    pref_bits = []
    if isinstance(prefs, dict):
        pref_bits.extend(
            [
                str(prefs.get("jobType") or ""),
                str(prefs.get("workMode") or ""),
                str(prefs.get("location") or ""),
                str(prefs.get("seniority") or ""),
            ]
        )
    prof_skills: List[str] = []
    prof_headline = ""
    prof_summary = ""
    prof_loc = ""
    pref_seniority = ""
    pref_loc = ""
    job_types: List[str] = []
    exp_prof: List[Dict[str, Any]] = []
    if profile:
        prof_skills = profile.get("skills") or []
        prof_headline = profile.get("headline") or ""
        prof_summary = profile.get("summary") or ""
        prof_loc = profile.get("location") or ""
        jp = profile.get("jobPreferences") or {}
        if isinstance(jp, dict):
            pref_seniority = str(jp.get("seniority") or "")
            pref_loc = str(jp.get("preferredLocation") or "")
            job_types = jp.get("jobTypes") or []
        exp_prof = profile.get("experience") or []
    exp_prof_lines = []
    for e in exp_prof:
        if isinstance(e, dict):
            exp_prof_lines.append(
                " ".join(
                    str(e.get(k) or "")
                    for k in ("role", "company", "description")
                )
            )
    all_skills = list(dict.fromkeys([*(skills_user or []), *(prof_skills or [])]))
    parts = [
        user.get("professionalHeadline") or "",
        prof_headline,
        " ".join(all_skills),
        user.get("bio") or "",
        prof_summary,
        user.get("location") or "",
        prof_loc,
        " ".join(exp_lines),
        " ".join(exp_prof_lines),
        " ".join(pref_bits),
        pref_seniority,
        pref_loc,
        " ".join(job_types) if isinstance(job_types, list) else "",
    ]
    return " ".join(p for p in parts if p).strip() or " "


async def get_or_create_embedding(doc_id: str, text: str, doc_type: str) -> List[float]:
    db = get_db()
    coll = db["embeddings_cache"]
    h = hash_text(text)
    existing = await coll.find_one({"doc_id": doc_id})
    if existing and existing.get("text_hash") == h and existing.get("embedding"):
        return list(existing["embedding"])

    embedding = generate_embedding(text)
    now = datetime.now(timezone.utc)
    await coll.update_one(
        {"doc_id": doc_id},
        {
            "$set": {
                "doc_id": doc_id,
                "doc_type": doc_type,
                "embedding": embedding,
                "text_hash": h,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )
    return embedding


def _oid(s: str) -> ObjectId:
    return ObjectId(s)


async def recompute_embedding(doc_id: str, doc_type: str) -> None:
    try:
        _oid(doc_id)
    except InvalidId as exc:
        raise ValueError("Invalid doc_id") from exc

    db = get_db()
    await db["embeddings_cache"].delete_one({"doc_id": doc_id})

    if doc_type == "user":
        user = await db["users"].find_one({"_id": ObjectId(doc_id)})
        if not user:
            raise ValueError("User not found")
        profile = await db["profiles"].find_one({"userId": ObjectId(doc_id)})
        text = build_user_text(user, profile)
        await get_or_create_embedding(doc_id, text, "user")
        return

    if doc_type == "job":
        job = await db["jobs"].find_one({"_id": ObjectId(doc_id)})
        if not job:
            raise ValueError("Job not found")
        text = build_job_text(job)
        await get_or_create_embedding(doc_id, text, "job")
        return

    raise ValueError("doc_type must be 'user' or 'job'")
