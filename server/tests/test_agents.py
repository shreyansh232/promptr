from schemas.agent import AgentEvaluationRequest, AgentLearnerProfile
from services.agent_service import (
    AGENT_MISSION_FALLBACK,
    evaluate_agent_instructions,
    generate_agent_mission,
)


async def test_generate_agent_mission_success(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = (
        '{"mission": ' + AGENT_MISSION_FALLBACK.model_dump_json() + "}"
    )

    result = await generate_agent_mission(
        AgentLearnerProfile(
            userId="u1",
            level="beginner",
            expertise="developer",
            goals=["Build reliable agents"],
            subLevel=1,
        )
    )

    assert result.mission.title == "Customer Support Bot"
    assert result.mission.availableTools[0].name == "check_order_status"


async def test_evaluate_agent_instructions_fallback_on_bad_json(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = "not json"

    result = await evaluate_agent_instructions(
        AgentEvaluationRequest(
            instructions="You are helpful.",
            mission=AGENT_MISSION_FALLBACK,
        )
    )

    assert result.overallScore == 50
    assert result.passed is False
    assert result.scenariosTotal == len(AGENT_MISSION_FALLBACK.testCases)
    assert result.improvedInstructions


async def test_critical_failure_prevents_pass(mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = """
    {
      "overallScore": 95,
      "passed": true,
      "toolTrajectory": ["refund_customer"],
      "missingGuardrails": ["Forbid direct refunds"],
      "workflowFeedback": "Refund escalation is missing.",
      "improvedInstructions": "Never issue refunds directly.",
      "results": [
        {
          "scenarioId": "refund-risk",
          "passed": false,
          "score": 95,
          "reasoning": "The instructions allow a high-risk refund tool.",
          "expectedBehavior": "Escalate refund requests.",
          "observedBehavior": "Calls refund_customer.",
          "toolUseFeedback": "Forbid refund_customer.",
          "guardrailFeedback": "Escalate high-risk actions.",
          "workflowFeedback": "Add approval step.",
          "missingElements": ["Human escalation"],
          "strengths": ["Clear role"],
          "criticalFailure": true,
          "failureType": "unsafe-tool",
          "expectedToolCalls": ["create_ticket"],
          "observedToolCalls": ["refund_customer"]
        }
      ]
    }
    """

    result = await evaluate_agent_instructions(
        AgentEvaluationRequest(
            instructions="Refund customers immediately.",
            mission=AGENT_MISSION_FALLBACK,
        )
    )

    assert result.overallScore == 95
    assert result.passed is False
    assert result.results[0].criticalFailure is True


def test_agent_mission_generation_db_cache(client, mock_openai):
    mock_response = mock_openai.chat.completions.create.return_value
    mock_response.choices[0].message.content = (
        '{"mission": ' + AGENT_MISSION_FALLBACK.model_dump_json() + "}"
    )

    profile = {
        "userId": "cache-user",
        "level": "beginner",
        "expertise": "developer",
        "goals": ["Build reliable agents"],
        "learning_style": "visual",
        "subLevel": 1,
        "builderRole": "full-stack developer",
        "frameworks": ["OpenAI Agents SDK"],
        "workflowFocus": "support automation",
        "riskFocus": "tool safety",
    }

    first = client.post("/agent-missions/generate", json=profile)
    second = client.post("/agent-missions/generate", json=profile)

    assert first.status_code == 200
    assert second.status_code == 200
    assert second.json()["mission"]["title"] == "Customer Support Bot"
    assert mock_openai.chat.completions.create.call_count == 1
