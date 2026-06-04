from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from core.db import close_db_connection
from routers.agents import router as agents_router
from routers.analysis import router as analysis_router
from routers.auth import router as auth_router
from routers.profile import router as profile_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
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

    app.include_router(auth_router, prefix="/auth")
    app.include_router(analysis_router)
    app.include_router(agents_router)
    app.include_router(profile_router, prefix="/profiles")

    @app.get("/")
    def health():
        return {"message": "healthy"}

    return app


app = create_app()
