import pytest
from fastapi.testclient import TestClient
from app import create_app
from unittest.mock import patch


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    return TestClient(app)


@pytest.fixture(autouse=True)
def mock_openai():
    with patch("services.llm_service.client") as mock:
        yield mock
