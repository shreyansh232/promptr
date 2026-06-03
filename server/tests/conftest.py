import pytest
from mongomock_motor import AsyncMongoMockClient
from fastapi.testclient import TestClient
from app import create_app
from core.db import get_db
from unittest.mock import patch


@pytest.fixture
def mock_db():
    client = AsyncMongoMockClient()
    return client.promptr


@pytest.fixture
def app(mock_db):
    app = create_app()
    app.dependency_overrides[get_db] = lambda: mock_db
    return app


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_openai():
    with patch("services.llm_service.client") as mock:
        from unittest.mock import AsyncMock

        mock.chat.completions.create = AsyncMock()
        yield mock
