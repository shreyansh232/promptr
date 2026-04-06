from fastapi import APIRouter, HTTPException
from typing import Optional

try:
    from backend.schemas.battle import (
        CreateBattleRequest,
        BattleGenerationRequest,
        BattleGenerationResponse,
        JoinBattleRequest,
        SubmitPromptRequest,
        BattleResponse,
        BattleListResponse,
        BattleResultResponse,
        BattleParticipantResponse,
        EloExchangeResponse,
    )
except ImportError:
    from schemas.battle import (
        CreateBattleRequest,
        BattleGenerationRequest,
        BattleGenerationResponse,
        JoinBattleRequest,
        SubmitPromptRequest,
        BattleResponse,
        BattleListResponse,
        BattleResultResponse,
        BattleParticipantResponse,
        EloExchangeResponse,
    )

router = APIRouter()

# In-memory store for battles (replace with DB in production)
# For now, this is a simple dict-based store
_battles: dict[str, dict] = {}
_participants: dict[str, list[dict]] = {}  # battleId -> [participants]


def _serialize_battle(battle: dict) -> dict:
    """Serialize a battle dict for API response."""
    return {
        "id": battle["id"],
        "title": battle["title"],
        "description": battle["description"],
        "goal": battle["goal"],
        "testCases": battle["testCases"],
        "status": battle["status"],
        "createdBy": battle["createdBy"],
        "opponentId": battle.get("opponentId"),
        "participants": battle.get("participants", []),
        "createdAt": battle.get("createdAt", ""),
        "updatedAt": battle.get("updatedAt", ""),
    }


@router.post("/generate")
async def generate_battle(request: BattleGenerationRequest) -> BattleGenerationResponse:
    """Generate AI content for a battle."""
    try:
        from backend.services.gemini_service import generate_battle_content
    except ImportError:
        from services.gemini_service import generate_battle_content

    result = generate_battle_content(request.title, request.description)
    return BattleGenerationResponse(**result)


@router.post("/create")
async def create_battle(request: CreateBattleRequest) -> dict:
    """Create a new prompt battle."""
    import uuid
    from datetime import datetime

    battle_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    battle = {
        "id": battle_id,
        "title": request.title,
        "description": request.description,
        "goal": request.goal,
        "testCases": request.testCases,
        "status": "WAITING",
        "createdBy": "",  # Set by the API route with user ID
        "opponentId": None,
        "participants": [],
        "createdAt": now,
        "updatedAt": now,
    }

    _battles[battle_id] = battle
    _participants[battle_id] = []

    return {"battleId": battle_id, "battle": _serialize_battle(battle)}


@router.post("/join")
async def join_battle(request: JoinBattleRequest) -> dict:
    """Join an existing battle as the opponent."""
    battle = _battles.get(request.battleId)
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle["status"] != "WAITING":
        raise HTTPException(status_code=400, detail="Battle is not open for joining")

    if battle["opponentId"]:
        raise HTTPException(status_code=400, detail="Battle already has an opponent")

    battle["status"] = "ACTIVE"
    battle["updatedAt"] = __import__("datetime").datetime.utcnow().isoformat()

    return {"battle": _serialize_battle(battle)}


@router.post("/submit")
async def submit_prompt(request: SubmitPromptRequest) -> dict:
    """Submit a prompt for a battle."""
    battle = _battles.get(request.battleId)
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle["status"] not in ("WAITING", "ACTIVE"):
        raise HTTPException(status_code=400, detail="Battle is not active")

    # Find or create participant entry
    participants = _participants.get(request.battleId, [])

    # Check if this user already submitted
    for p in participants:
        if p.get("prompt") is not None:
            # Already has a prompt, check if it's the same user
            pass

    # Add/update participant
    participant = {
        "userId": "",  # Set by API route
        "prompt": request.prompt,
        "tokenCount": len(request.prompt.split()),  # Approximate token count
        "score": None,
        "passed": None,
        "result": None,
        "eloChange": None,
        "submittedAt": __import__("datetime").datetime.utcnow().isoformat(),
    }

    # If this is the first participant, they're the creator
    if not participants:
        participant["userId"] = battle["createdBy"]
        participants.append(participant)
    else:
        participant["userId"] = battle.get("opponentId", "")
        participants.append(participant)

    _participants[request.battleId] = participants

    # If both have submitted, evaluate
    submitted_count = sum(1 for p in participants if p.get("prompt"))
    if submitted_count >= 2 and battle["testCases"]:
        return await _evaluate_battle(request.battleId, battle, participants)

    return {
        "status": "submitted",
        "submittedCount": submitted_count,
        "totalRequired": 2,
    }


async def _evaluate_battle(
    battle_id: str, battle: dict, participants: list[dict]
) -> dict:
    """Evaluate both prompts and determine winner."""
    try:
        from backend.services.gemini_service import evaluate_prompt_full
    except ImportError:
        from services.gemini_service import evaluate_prompt_full

    test_cases = battle["testCases"]
    results = []

    for i, participant in enumerate(participants):
        if participant.get("prompt"):
            eval_result = evaluate_prompt_full(participant["prompt"], test_cases)
            participant["score"] = eval_result["overallScore"]
            participant["passed"] = eval_result["passed"]
            participant["testCasesPassed"] = eval_result["testCasesPassed"]
            participant["testCasesTotal"] = eval_result["testCasesTotal"]
            results.append(eval_result)

    # Determine winner
    p1 = participants[0]
    p2 = participants[1]

    p1_score = p1.get("score", 0) or 0
    p2_score = p2.get("score", 0) or 0

    if p1_score > p2_score:
        winner, loser = p1, p2
        p1["result"] = "WIN"
        p2["result"] = "LOSS"
    elif p2_score > p1_score:
        winner, loser = p2, p1
        p2["result"] = "WIN"
        p1["result"] = "LOSS"
    else:
        # Tiebreaker: fewer tokens wins
        p1_tokens = p1.get("tokenCount", 0) or 0
        p2_tokens = p2.get("tokenCount", 0) or 0
        if p1_tokens < p2_tokens:
            winner, loser = p1, p2
            p1["result"] = "WIN"
            p2["result"] = "LOSS"
        elif p2_tokens < p1_tokens:
            winner, loser = p2, p1
            p2["result"] = "WIN"
            p1["result"] = "LOSS"
        else:
            p1["result"] = "DRAW"
            p2["result"] = "DRAW"
            winner = loser = None

    battle["status"] = "COMPLETED"
    battle["participants"] = participants

    return {
        "status": "completed",
        "battle": _serialize_battle(battle),
        "results": results,
    }


@router.get("/list")
async def list_battles(status: Optional[str] = None) -> dict:
    """List all battles, optionally filtered by status."""
    battles = []
    for battle in _battles.values():
        if status and battle["status"] != status:
            continue
        battles.append(_serialize_battle(battle))

    return {"battles": battles}


@router.get("/{battle_id}")
async def get_battle(battle_id: str) -> dict:
    """Get a specific battle by ID."""
    battle = _battles.get(battle_id)
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    return {"battle": _serialize_battle(battle)}
