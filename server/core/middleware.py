import asyncio
import sys
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware

from services.redis import redis_client

LUA_RATE_LIMIT_SCRIPT = """
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4] or 1)

local bucket = redis.call('HMGET', key, 'tokens', 'last_updated')
local tokens = tonumber(bucket[1])
local last_updated = tonumber(bucket[2])

if not tokens then
    tokens = capacity
    last_updated = now
else
    local elapsed = now - last_updated
    if elapsed > 0 then
        tokens = math.min(capacity, tokens + elapsed * refill_rate)
        last_updated = now
    end
end

if tokens >= requested then
    tokens = tokens - requested
    redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
    redis.call('EXPIRE', key, 3600)
    return 1
else
    redis.call('HMSET', key, 'tokens', tokens, 'last_updated', last_updated)
    redis.call('EXPIRE', key, 3600)
    return 0
end
"""


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        max_requests: int = 60,
        window_seconds: int = 60,
        delay_seconds: float = 0.5,
    ):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.delay_seconds = delay_seconds

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"

        if client_ip != "unknown":
            try:
                redis_key = f"rate_limit:{client_ip}"
                capacity = self.max_requests
                refill_rate = self.max_requests / self.window_seconds
                now = time.time()

                # Execute atomic Lua script in Redis
                allowed = await redis_client.eval(
                    LUA_RATE_LIMIT_SCRIPT,
                    1,
                    redis_key,
                    str(capacity),
                    str(refill_rate),
                    str(now),
                    "1",
                )

                if allowed == 0:
                    return JSONResponse(
                        status_code=429,
                        content={
                            "detail": "Rate limit exceeded. Please try again later."
                        },
                    )
            except Exception as e:
                # Fail-open if Redis is unreachable or error occurs, to keep app functional
                logger.warning(f"Redis rate limiting failed (fail-open): {e}")

        # Slow API simulation: add artificial delay (skip during tests)
        if self.delay_seconds > 0 and "pytest" not in sys.modules:
            await asyncio.sleep(self.delay_seconds)

        response = await call_next(request)
        return response
