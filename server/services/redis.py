import redis.asyncio as redis
from config import get_settings
from loguru import logger

settings = get_settings()

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


async def ping() -> bool:
    """Check if Redis is reachable."""
    try:
        return await redis_client.ping()
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return False
