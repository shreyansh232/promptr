def _create_battle(client):
    request_data = {
        "title": "SQL Expert Battle",
        "description": "Write a prompt that generates complex SQL queries.",
        "goal": "Generate a valid PostgreSQL query for the given schema.",
        "testCases": [
            {
                "input": "Users table",
                "expectedOutput": "SELECT * FROM users",
                "description": "Basic query",
            }
        ],
    }

    response = client.post("/battles/create", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert "battleId" in data
    assert data["battle"]["title"] == "SQL Expert Battle"
    return data["battleId"]


def test_create_battle(client):
    _create_battle(client)


def test_join_battle(client):
    # First create a battle
    battle_id = _create_battle(client)

    request_data = {"battleId": battle_id}
    response = client.post("/battles/join", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert data["battle"]["status"] == "ACTIVE"


def test_list_battles(client):
    _create_battle(client)
    response = client.get("/battles/list")
    assert response.status_code == 200
    data = response.json()
    assert len(data["battles"]) >= 1


def test_get_battle(client):
    battle_id = _create_battle(client)
    response = client.get(f"/battles/{battle_id}")
    assert response.status_code == 200
    assert response.json()["battle"]["id"] == battle_id


def test_submit_prompt(client, mock_openai):
    # Setup mock for evaluation
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[
        0
    ].message.content = '{"score": 95, "passed": true, "reasoning": "Good", "missing_elements": [], "strengths": ["All"]}'

    battle_id = _create_battle(client)

    # Participant 1 (Creator) submits
    response = client.post(
        "/battles/submit",
        json={"battleId": battle_id, "prompt": "Select all from users"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "submitted"

    # Join the battle (to make it active)
    client.post("/battles/join", json={"battleId": battle_id})

    # Participant 2 (Opponent) submits
    response = client.post(
        "/battles/submit",
        json={"battleId": battle_id, "prompt": "SELECT * FROM users;"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "results" in data
    assert data["battle"]["status"] == "COMPLETED"


def test_generate_battle_content(client, mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = '{"goal": "New Goal", "testCases": []}'

    request_data = {"title": "New Battle", "description": "Some description"}
    response = client.post("/battles/generate", json=request_data)
    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "New Goal"
