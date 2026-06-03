from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from motor.core import AgnosticDatabase

from core.db import get_db
from schemas.battle import (
    CreateBattleRequest,
    BattleGenerationRequest,
    BattleGenerationResponse,
    JoinBattleRequest,
    SubmitPromptRequest,
)

router = APIRouter()


def _serialize_battle(battle: dict) -> dict:
    """Serialize a battle dict for API response."""
    return {
        "id": battle.get("id") or str(battle.get("_id")),
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
    from services.llm_service import generate_battle_content

    result = await generate_battle_content(request.title, request.description)
    return BattleGenerationResponse(**result)


@router.post("/create")
async def create_battle(request: CreateBattleRequest, db=Depends(get_db)) -> dict:
    """Create a new prompt battle."""
    import uuid
    from datetime import UTC, datetime

    battle_id = str(uuid.uuid4())
    now = datetime.now(UTC).isoformat()

    battle = {
        "id": battle_id,
        "title": request.title,
        "description": request.description,
        "goal": request.goal,
        "testCases": request.testCases,
        "status": "WAITING",
        "createdBy": request.createdBy,
        "opponentId": None,
        "participants": [
            {
                "userId": request.createdBy,
                "userName": request.createdByName or None,
            }
        ]
        if request.createdBy
        else [],
        "createdAt": now,
        "updatedAt": now,
    }

    await db.battles.insert_one(battle)

    return {"battleId": battle_id, "battle": _serialize_battle(battle)}


@router.post("/join")
async def join_battle(request: JoinBattleRequest, db=Depends(get_db)) -> dict:
    """Join an existing battle as the opponent."""
    battle = await db.battles.find_one({"id": request.battleId})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle["status"] != "WAITING":
        raise HTTPException(status_code=400, detail="Battle is not open for joining")

    if battle["opponentId"]:
        raise HTTPException(status_code=400, detail="Battle already has an opponent")

    from datetime import UTC, datetime

    now = datetime.now(UTC).isoformat()

    opponent_participant = {
        "userId": request.userId,
        "userName": request.userName or None,
    }

    await db.battles.update_one(
        {"id": request.battleId},
        {
            "$set": {
                "status": "ACTIVE",
                "updatedAt": now,
                "opponentId": request.userId,
            },
            "$push": {"participants": opponent_participant},
        },
    )

    battle = await db.battles.find_one({"id": request.battleId})
    return {"battle": _serialize_battle(battle)}


@router.post("/submit")
async def submit_prompt(request: SubmitPromptRequest, db=Depends(get_db)) -> dict:
    """Submit a prompt for a battle."""
    battle = await db.battles.find_one({"id": request.battleId})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    if battle["status"] not in ("WAITING", "ACTIVE"):
        raise HTTPException(status_code=400, detail="Battle is not active")

    participants = battle.get("participants", [])

    # Add/update participant
    from datetime import UTC, datetime

    participant = {
        "userId": "",
        "prompt": request.prompt,
        "tokenCount": len(request.prompt.split()),
        "score": None,
        "passed": None,
        "result": None,
        "eloChange": None,
        "submittedAt": datetime.now(UTC).isoformat(),
    }

    # Simplified logic for demo: if 0 participants, this is P1, if 1, this is P2
    if not participants:
        participant["userId"] = battle["createdBy"]
    else:
        participant["userId"] = battle.get("opponentId", "")

    participants.append(participant)

    await db.battles.update_one(
        {"id": request.battleId}, {"$set": {"participants": participants}}
    )

    # If both have submitted, evaluate
    if len(participants) >= 2 and battle["testCases"]:
        return await _evaluate_battle(request.battleId, battle, participants, db)

    return {
        "status": "submitted",
        "submittedCount": len(participants),
        "totalRequired": 2,
    }


async def _evaluate_battle(
    battle_id: str, battle: dict, participants: list[dict], db: AgnosticDatabase
) -> dict:
    """Evaluate both prompts concurrently and determine winner."""
    import asyncio
    from services.llm_service import evaluate_prompt_full

    test_cases = battle["testCases"]

    async def eval_participant(p: dict):
        if p.get("prompt"):
            eval_result = await evaluate_prompt_full(p["prompt"], test_cases)
            p["score"] = eval_result["overallScore"]
            p["passed"] = eval_result["passed"]
            p["testCasesPassed"] = eval_result["testCasesPassed"]
            p["testCasesTotal"] = eval_result["testCasesTotal"]
            return eval_result
        return None

    eval_results = await asyncio.gather(*(eval_participant(p) for p in participants))
    results = [res for res in eval_results if res is not None]

    # Determine winner
    p1 = participants[0]
    p2 = participants[1]

    p1_score = p1.get("score", 0) or 0
    p2_score = p2.get("score", 0) or 0

    if p1_score > p2_score:
        p1["result"] = "WIN"
        p2["result"] = "LOSS"
    elif p2_score > p1_score:
        p2["result"] = "WIN"
        p1["result"] = "LOSS"
    else:
        # Tiebreaker: fewer tokens wins
        p1_tokens = p1.get("tokenCount", 0) or 0
        p2_tokens = p2.get("tokenCount", 0) or 0
        if p1_tokens < p2_tokens:
            p1["result"] = "WIN"
            p2["result"] = "LOSS"
        elif p2_tokens < p1_tokens:
            p2["result"] = "WIN"
            p1["result"] = "LOSS"
        else:
            p1["result"] = "DRAW"
            p2["result"] = "DRAW"

    from datetime import UTC, datetime

    now = datetime.now(UTC).isoformat()

    await db.battles.update_one(
        {"id": battle_id},
        {
            "$set": {
                "status": "COMPLETED",
                "participants": participants,
                "updatedAt": now,
            }
        },
    )

    battle["status"] = "COMPLETED"
    battle["participants"] = participants

    return {
        "status": "completed",
        "battle": _serialize_battle(battle),
        "results": results,
    }


@router.get("/list")
async def list_battles(status: Optional[str] = None, db=Depends(get_db)) -> dict:
    """List all battles, optionally filtered by status."""
    query = {}
    if status:
        query["status"] = status

    cursor = db.battles.find(query)
    battles = []
    async for battle in cursor:
        battles.append(_serialize_battle(battle))

    return {"battles": battles}


@router.get("/{battle_id}")
async def get_battle(battle_id: str, db=Depends(get_db)) -> dict:
    """Get a specific battle by ID."""
    battle = await db.battles.find_one({"id": battle_id})
    if not battle:
        raise HTTPException(status_code=404, detail="Battle not found")

    return {"battle": _serialize_battle(battle)}
