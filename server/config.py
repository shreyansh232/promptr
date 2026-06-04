from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    frontend_url: str = "http://localhost:3000"
    # Explicit backend base URL — must be set in prod to your deployed domain.
    # request.url_for() reads the internal proxy host (localhost:8000) and
    # produces wrong OAuth redirect URIs in hosted environments.
    backend_url: str = "http://localhost:8000"
    database_url: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/promptr"
    database_name: str = "promptr"
    redis_url: str = "redis://localhost:6379/0"

    # Auth
    auth_secret: str = "supersecretkey"
    github_client_id: str = ""
    github_client_secret: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


@lru_cache
def get_settings() -> Settings:
    setting = Settings()
    return setting
