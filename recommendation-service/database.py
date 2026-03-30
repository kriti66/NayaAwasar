import os
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv()

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def connect_db() -> None:
    global _client, _db
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "nayaawasar")
    _client = AsyncIOMotorClient(uri)
    _db = _client[db_name]


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
    _client = None
    _db = None


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() during startup.")
    return _db


async def setup_indexes() -> None:
    db = get_db()
    await db["embeddings_cache"].create_index("doc_id", unique=True)
    await db["user_interactions"].create_index([("user_id", 1), ("job_id", 1)])
