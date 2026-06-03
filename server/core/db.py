from motor.motor_asyncio import AsyncIOMotorClient
from motor.core import AgnosticDatabase
from config import get_settings
from typing import Optional

settings = get_settings()


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AgnosticDatabase] = None


db_client = MongoDB()


async def get_db() -> AgnosticDatabase:
    """Dependency for getting the database instance."""
    if db_client.db is None:
        # If db is accessed before connection (e.g. in tests or edge cases)
        # we try to connect once
        await connect_to_mongo()

    if db_client.db is None:
        raise RuntimeError("Database connection not initialized")

    return db_client.db


async def connect_to_mongo():
    """Initializes the MongoDB connection."""
    if db_client.client is None:
        db_client.client = AsyncIOMotorClient(settings.database_url)
        db_client.db = db_client.client[settings.database_name]
        print(f"Connected to MongoDB: {settings.database_name}")


async def close_mongo_connection():
    """Closes the MongoDB connection."""
    if db_client.client:
        db_client.client.close()
        db_client.client = None
        db_client.db = None
        print("Closed MongoDB connection")
