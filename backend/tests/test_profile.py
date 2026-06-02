def test_solved_problems_flow(client):
    user_id = "test_user_id"

    # 1. Get solved problems initially (should be empty)
    response = client.get(f"/profiles/{user_id}/solved-problems")
    assert response.status_code == 200
    assert response.json() == []

    # 2. Save a solved problem
    solved_problem_data = {
        "userLevel": "beginner",
        "subLevel": 1,
        "problemTitle": "Intro to Prompting",
        "problemJson": '{"title": "Intro to Prompting"}',
        "userPrompt": "Act like a writer and write a poem.",
    }

    response = client.post(
        f"/profiles/{user_id}/solved-problems", json=solved_problem_data
    )
    assert response.status_code == 200
    assert response.json() == {"success": True}

    # 3. Get solved problems again (should contain the saved problem)
    response = client.get(f"/profiles/{user_id}/solved-problems")
    assert response.status_code == 200
    solved_problems = response.json()
    assert len(solved_problems) == 1
    assert solved_problems[0]["userId"] == user_id
    assert solved_problems[0]["userLevel"] == "beginner"
    assert solved_problems[0]["subLevel"] == 1
    assert solved_problems[0]["problemTitle"] == "Intro to Prompting"
    assert solved_problems[0]["problemJson"] == '{"title": "Intro to Prompting"}'
    assert solved_problems[0]["userPrompt"] == "Act like a writer and write a poem."
    assert "createdAt" in solved_problems[0]


def test_solved_problems_no_overwrite(client):
    user_id = "test_user_id"

    # 1. Save first solved problem
    solved_problem_data1 = {
        "userLevel": "beginner",
        "subLevel": 1,
        "problemTitle": "Intro to Prompting",
        "problemJson": '{"title": "Intro to Prompting"}',
        "userPrompt": "First prompt",
    }
    response = client.post(f"/profiles/{user_id}/solved-problems", json=solved_problem_data1)
    assert response.status_code == 200

    # 2. Save second solved problem with a different title in the same sublevel
    solved_problem_data2 = {
        "userLevel": "beginner",
        "subLevel": 1,
        "problemTitle": "Intermediate Prompting",
        "problemJson": '{"title": "Intermediate Prompting"}',
        "userPrompt": "Second prompt",
    }
    response = client.post(f"/profiles/{user_id}/solved-problems", json=solved_problem_data2)
    assert response.status_code == 200

    # 3. Get solved problems - should contain both problems instead of overwriting
    response = client.get(f"/profiles/{user_id}/solved-problems")
    assert response.status_code == 200
    solved_problems = response.json()
    assert len(solved_problems) == 2

    # Verify both solved problems exist by title
    titles = [sp["problemTitle"] for sp in solved_problems]
    assert "Intro to Prompting" in titles
    assert "Intermediate Prompting" in titles
