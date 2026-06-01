from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers.analysis import router as analysis_router
from routers.battle import router as battle_router

settings = get_settings()


def create_app() -> FastAPI:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis_router)
    app.include_router(battle_router, prefix="/battles")

    @app.get("/")
    def health():
        return {"message": "healthy"}

    return app


app = create_app()
