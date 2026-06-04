def test_get_profile_me_default(client, mock_auth_user):
    # 1. Fetch profile for the authenticated test user (initially doesn't exist, so it should be created)
    response = client.get("/api/profiles/me")
    assert response.status_code == 200

    profile = response.json()
    assert profile["userId"] == str(mock_auth_user.id)
    assert profile["level"] == "beginner"
    assert profile["subLevel"] == 1
    assert profile["problemsSolved"] == 0
    assert profile["streak"] == 0
    assert profile["expertise"] == "general"
    assert profile["goals"] == []


def test_update_profile(client, mock_auth_user):
    # 1. Update the profile
    update_data = {
        "userId": str(mock_auth_user.id),
        "level": "expert",
        "subLevel": 3,
        "expertise": "agent workflows",
        "application": "customer support automation",
        "goals": ["Master agent tool use", "Build reliable pipelines"],
    }

    response = client.post("/api/profiles/", json=update_data)
    assert response.status_code == 200

    updated_profile = response.json()
    assert updated_profile["userId"] == str(mock_auth_user.id)
    assert updated_profile["level"] == "expert"
    assert updated_profile["subLevel"] == 3
    assert updated_profile["expertise"] == "agent workflows"
    assert updated_profile["application"] == "customer support automation"
    assert updated_profile["goals"] == [
        "Master agent tool use",
        "Build reliable pipelines",
    ]

    # 2. Fetch the profile to confirm it was persisted
    response = client.get("/api/profiles/me")
    assert response.status_code == 200

    profile = response.json()
    assert profile["level"] == "expert"
    assert profile["subLevel"] == 3
    assert profile["expertise"] == "agent workflows"
    assert profile["application"] == "customer support automation"
    assert profile["goals"] == ["Master agent tool use", "Build reliable pipelines"]


def test_rate_limit_middleware_allowed(client):
    from unittest.mock import AsyncMock, patch

    with patch(
        "core.middleware.redis_client.eval", new_callable=AsyncMock
    ) as mock_eval:
        mock_eval.return_value = 1
        response = client.get("/")
        assert response.status_code == 200


def test_rate_limit_middleware_denied(client):
    from unittest.mock import AsyncMock, patch

    with patch(
        "core.middleware.redis_client.eval", new_callable=AsyncMock
    ) as mock_eval:
        mock_eval.return_value = 0
        response = client.get("/")
        assert response.status_code == 429
        assert response.json() == {
            "detail": "Rate limit exceeded. Please try again later."
        }


def test_rate_limit_middleware_fail_open(client):
    from unittest.mock import AsyncMock, patch

    with patch(
        "core.middleware.redis_client.eval", new_callable=AsyncMock
    ) as mock_eval:
        mock_eval.side_effect = Exception("Redis connection refused")
        response = client.get("/")
        assert response.status_code == 200
