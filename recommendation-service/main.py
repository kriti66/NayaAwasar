import os
from contextlib import asynccontextmanager

from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database import close_db, connect_db, setup_indexes
from embeddings import load_model, recompute_embedding
from models import (
    HealthResponse,
    RecommendRequest,
    RecommendResponse,
    RecomputeRequest,
    SimilarJobsRequest,
    SimilarJobsResponse,
)
from recommender import get_similar_jobs, hybrid_recommend

load_dotenv()




@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_db()
    await setup_indexes()
    import asyncio
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, _load_model_in_thread)  # ← non-blocking
    yield
    await close_db()


def _load_model_in_thread():
    from embeddings import get_model
    get_model()  # loads in background thread, doesn't block server




app = FastAPI(title="Naya Awasar Recommendation Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://naya-awasar.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(body: RecommendRequest):
    try:
        ObjectId(body.user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid user_id")

    from database import get_db

    db = get_db()
    user = await db["users"].find_one({"_id": ObjectId(body.user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    recs = await hybrid_recommend(body.user_id, top_n=body.limit)
    items = [
        {
            "job_id": r["job_id"],
            "title": r["title"],
            "company": r["company"],
            "location": r["location"],
            "salary": r.get("salary"),
            "similarity_score": r["similarity_score"],
            "reason": r["reason"],
        }
        for r in recs
    ]
    return RecommendResponse(
        user_id=body.user_id,
        recommendations=items,
        total=len(items),
    )


@app.post("/similar-jobs", response_model=SimilarJobsResponse)
async def similar_jobs(body: SimilarJobsRequest):
    try:
        ObjectId(body.job_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid job_id")

    from database import get_db

    db = get_db()
    job = await db["jobs"].find_one({"_id": ObjectId(body.job_id)})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    recs = await get_similar_jobs(body.job_id, top_n=body.limit)
    items = [
        {
            "job_id": r["job_id"],
            "title": r["title"],
            "company": r["company"],
            "location": r["location"],
            "salary": r.get("salary"),
            "similarity_score": r["similarity_score"],
            "reason": r["reason"],
        }
        for r in recs
    ]
    return SimilarJobsResponse(
        job_id=body.job_id,
        similar_jobs=items,
        total=len(items),
    )


@app.post("/recompute-embeddings")
async def recompute_embeddings(body: RecomputeRequest):
    try:
        await recompute_embedding(body.doc_id, body.doc_type)
    except ValueError as e:
        msg = str(e).lower()
        if "not found" in msg:
            raise HTTPException(status_code=404, detail=str(e)) from e
        raise HTTPException(status_code=400, detail=str(e)) from e
    return {"message": "Recomputed successfully"}


@app.get("/health", response_model=HealthResponse)
async def health():
    from database import get_db
    from embeddings import is_model_loaded

    model_loaded = is_model_loaded()
    db_connected = False
    try:
        db = get_db()
        await db.command("ping")
        db_connected = True
    except Exception:
        db_connected = False

    status = "ok" if model_loaded and db_connected else "degraded"
    return HealthResponse(
        status=status,
        model_loaded=model_loaded,
        db_connected=db_connected,
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
