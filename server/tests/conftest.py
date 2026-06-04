"""
Test configuration using fully mocked database and Redis.
No real Postgres or Redis connection is required to run the test suite.
All DB and Redis interactions are replaced with AsyncMock/MagicMock,
so tests work in CI/CD without any infrastructure setup.
"""

import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app import create_app
from core.db import get_db
from core.security import get_current_user
from models.user import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _scalar_result(value=None):
    """Build a mock result whose .scalar_one_or_none() and .scalar() return value."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    result.scalar.return_value = value
    result.scalars.return_value.first.return_value = value
    result.scalars.return_value.all.return_value = [] if value is None else [value]
    return result


async def _refresh_with_defaults(instance):
    """Simulate what SQLAlchemy refresh does: fill server-side defaults."""
    if hasattr(instance, "created_at") and instance.created_at is None:
        instance.created_at = datetime.now(UTC)
    if hasattr(instance, "updated_at") and instance.updated_at is None:
        instance.updated_at = datetime.now(UTC)
    if hasattr(instance, "id") and instance.id is None:
        instance.id = uuid.uuid4()


def _make_stateful_profile_session() -> AsyncMock:
    """
    Stateful mock session for profile tests.

    Maintains an in-memory store so that:
    - add(profile) persists the object
    - refresh(profile) fills in server-side defaults
    - execute() returns the stored profile on subsequent lookups
    - The avg-reliability execute() always returns None → score = 0
    """
    from models.user import UserProfile

    _store: dict[str, object] = {}  # user_id → UserProfile instance

    async def _refresh(instance):
        await _refresh_with_defaults(instance)
        # Keep store up to date after a refresh
        if isinstance(instance, UserProfile) and instance.user_id is not None:
            _store[str(instance.user_id)] = instance

    def _add(instance):
        if isinstance(instance, UserProfile) and instance.user_id is not None:
            _store[str(instance.user_id)] = instance

    call_count = {"n": 0}

    async def _execute(_query):
        call_count["n"] += 1
        # Every even-numbered call is the avg-score query → return None
        if call_count["n"] % 2 == 0:
            return _scalar_result(None)
        # Every odd call is a UserProfile lookup
        # Return whichever profile is in the store (None if not yet added)
        stored = next(iter(_store.values()), None) if _store else None
        return _scalar_result(stored)

    session = AsyncMock()
    session.add = MagicMock(side_effect=_add)
    session.commit = AsyncMock()
    session.refresh = AsyncMock(side_effect=_refresh)
    session.delete = AsyncMock()
    session.execute = AsyncMock(side_effect=_execute)
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=False)
    return session


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_user() -> User:
    """A synthetic in-memory User — no DB touch."""
    return User(
        id=uuid.uuid4(),
        email=f"test_{uuid.uuid4()}@example.com",
        name="Test User",
    )


# Alias so existing tests that use ``mock_auth_user`` continue to work.
@pytest.fixture
def mock_auth_user(mock_user: User) -> User:
    return mock_user


@pytest.fixture
def app(mock_user: User):
    """FastAPI app with DB and auth dependencies replaced by mocks."""
    application = create_app()
    session = _make_stateful_profile_session()

    async def override_get_db():
        yield session

    application.dependency_overrides[get_db] = override_get_db
    application.dependency_overrides[get_current_user] = lambda: mock_user
    return application


@pytest.fixture
def client(app) -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_llm():
    """Prevent any real OpenAI calls in every test."""
    with patch("services.llm_service.client") as mock:
        mock.chat.completions.create = AsyncMock()
        yield mock


@pytest.fixture(autouse=True)
def mock_redis():
    """Prevent any real Redis calls in every test (fail-open = allow)."""
    with patch("core.middleware.redis_client") as mock:
        mock.eval = AsyncMock(return_value=1)
        yield mock
