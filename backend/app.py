from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from core.db import connect_to_mongo, close_mongo_connection
from routers.analysis import router as analysis_router
from routers.battle import router as battle_router
from routers.profile import router as profile_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    yield
    await close_mongo_connection()


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis_router)
    app.include_router(battle_router, prefix="/battles")
    app.include_router(profile_router, prefix="/profiles")

    @app.get("/")
    def health():
        return {"message": "healthy"}

    return app


app = create_app()
