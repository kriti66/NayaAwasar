from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    user_id: str
    seeker_profile: Optional[Dict[str, Any]] = None
    jobs: Optional[List[Dict[str, Any]]] = None
    limit: int = Field(default=10, ge=1, le=100)


class SimilarJobsRequest(BaseModel):
    job_id: str
    limit: int = Field(default=5, ge=1, le=50)


class RecomputeRequest(BaseModel):
    doc_id: str
    doc_type: Literal["user", "job"]


class JobRecommendation(BaseModel):
    job_id: str
    title: str
    company: str
    location: str
    salary: Optional[str] = None
    similarity_score: float
    reason: str


class RecommendResponse(BaseModel):
    user_id: str
    recommendations: List[JobRecommendation]
    total: int


class SimilarJobsResponse(BaseModel):
    job_id: str
    similar_jobs: List[JobRecommendation]
    total: int


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    db_connected: bool
