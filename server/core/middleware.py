import asyncio
import sys

from fastapi import Request
from fastapi.responses import JSONResponse
from loguru import logger
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware

from core.rate_limit import limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        max_requests: int = 60,
        window_seconds: int = 60,
        delay_seconds: float = 0.5,
    ):
        super().__init__(app)
        self.delay_seconds = delay_seconds

    async def dispatch(self, request: Request, call_next):
        app = request.app
        # Register limiter on app state if it's not already there
        if not hasattr(app.state, "limiter"):
            app.state.limiter = limiter

        if not limiter.enabled:
            return await call_next(request)

        try:
            from slowapi.middleware import _find_route_handler, _should_exempt

            handler = _find_route_handler(app.routes, request.scope)
            if not _should_exempt(limiter, handler):
                limiter._check_request_limit(request, handler, True)
        except RateLimitExceeded:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."},
            )
        except Exception as e:
            # Fail-open if Limiter/Key extraction/Storage fails
            logger.warning(f"Rate limiting failed (fail-open): {e}")

        # Slow API simulation: add artificial delay (skip during tests)
        if self.delay_seconds > 0 and "pytest" not in sys.modules:
            await asyncio.sleep(self.delay_seconds)

        response = await call_next(request)
        return response
