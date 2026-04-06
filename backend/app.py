from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.routers.analysis import router as analysis_router
    from backend.routers.battle import router as battle_router
except ImportError:
    from routers.analysis import router as analysis_router
    from routers.battle import router as battle_router


def create_app() -> FastAPI:
    app = FastAPI()

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(analysis_router)
    app.include_router(battle_router, prefix="/battles")
    return app


app = create_app()
