from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.sessions import SessionMiddleware

from config import get_settings
from core.db import close_db_connection, get_db
from models.user import User
from core.middleware import RateLimitMiddleware
from routers.agents import router as agents_router
from routers.analysis import router as analysis_router
from routers.auth import router as auth_router
from routers.profile import router as profile_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create database tables if they do not exist in the database.
    # This ensures production and serverless environments initialize the schema on boot.
    try:
        from core.db import Base, engine
        import models  # noqa: F401

        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"Database auto-creation log: {e}")

    yield
    await close_db_connection()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_url,
            "http://localhost:3000",
            "http://localhost:3001",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.auth_secret,
    )
    app.add_middleware(
        RateLimitMiddleware,
        max_requests=60,
        window_seconds=60,
        delay_seconds=0.5,
    )

    app.include_router(auth_router, prefix="/api/auth")
    app.include_router(analysis_router, prefix="/api")
    app.include_router(agents_router, prefix="/api")
    app.include_router(profile_router, prefix="/api/profiles")

    @app.get("/")
    def root():
        return {"message": "healthy"}

    @app.get("/health")
    async def readiness(db: AsyncSession = Depends(get_db)):
        """Checks Postgres and Redis connectivity."""
        checks: dict[str, object] = {"status": "ok"}

        # Postgres check
        try:
            # Simple count query to verify DB connection
            result = await db.execute(select(func.count()).select_from(User))
            count = result.scalar()
            checks["postgres"] = "ok"
            checks["initialized"] = (count or 0) > 0
        except Exception:
            checks["postgres"] = "unreachable"
            checks["status"] = "unhealthy"
            return JSONResponse(content=checks, status_code=503)

        # Redis check
        from services.redis import ping as redis_ping

        if not await redis_ping():
            checks["redis"] = "unreachable"
            checks["status"] = "degraded"
        else:
            checks["redis"] = "ok"

        return checks

    return app


app = create_app()
