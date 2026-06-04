import asyncio
import pytest
import asyncpg
import uuid
from unittest.mock import patch
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from fastapi.testclient import TestClient

from app import create_app
from core.db import get_db, Base
from core.security import get_current_user
from models.user import User

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/promptr_test"

# Use NullPool to prevent connection reuse issues in concurrent tests
test_engine = create_async_engine(TEST_DATABASE_URL, future=True, poolclass=NullPool)
test_async_session_maker = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def create_test_db():
    # Connect to default postgres DB to run CREATE DATABASE
    conn = await asyncpg.connect(
        "postgresql://postgres:postgres@localhost:5432/postgres"
    )
    try:
        await conn.execute("CREATE DATABASE promptr_test")
    except asyncpg.exceptions.DuplicateDatabaseError:
        pass
    finally:
        await conn.close()


async def setup_test_tables():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    asyncio.run(create_test_db())
    asyncio.run(setup_test_tables())
    yield


@pytest.fixture
def app() -> create_app:
    app = create_app()

    async def override_get_db():
        async with test_async_session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
async def mock_auth_user(app):
    user_id = uuid.uuid4()
    test_user = User(
        id=user_id,
        email=f"test_{user_id}@example.com",
        name="Test User",
    )
    async with test_async_session_maker() as session:
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)

    # Override dependency
    app.dependency_overrides[get_current_user] = lambda: test_user

    yield test_user

    # Cleanup dependency and user in DB
    app.dependency_overrides.pop(get_current_user, None)
    async with test_async_session_maker() as session:
        await session.execute(delete(User).where(User.id == user_id))
        await session.commit()


@pytest.fixture(autouse=True)
def mock_llm():
    with patch("services.llm_service.client") as mock:
        from unittest.mock import AsyncMock

        mock.chat.completions.create = AsyncMock()
        yield mock
