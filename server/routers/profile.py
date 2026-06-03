from fastapi import APIRouter, Depends, HTTPException
from motor.core import AgnosticDatabase
from datetime import datetime, UTC
from pydantic import BaseModel
from bson import ObjectId
from loguru import logger

from core.db import get_db
from schemas.models import UserProfile

router = APIRouter()


async def check_is_admin(user_id: str, db: AgnosticDatabase) -> bool:
    """Helper to check if a user has the admin role."""
    try:
        if not ObjectId.is_valid(user_id):
            return False
        user = await db.User.find_one({"_id": ObjectId(user_id)})
        return user and user.get("role") == "admin"
    except Exception:
        return False


@router.get("/{user_id}")
async def get_profile(user_id: str, db: AgnosticDatabase = Depends(get_db)):
    logger.info(f"Fetching profile for user: {user_id}")
    profile = await db.profiles.find_one({"userId": user_id})
    is_admin = await check_is_admin(user_id, db)

    if not profile:
        # Create default profile if not found
        profile = {
            "userId": user_id,
            "level": "beginner",
            "subLevel": 1,
            "elo": 1000,
            "problemsSolved": 0,
            "streak": 0,
            "expertise": "general",
            "application": "",
            "learningStyle": "visual",
            "goals": [],
            "credits": 50 if not is_admin else 999,
            "lastCreditRefresh": datetime.now(UTC),
            "createdAt": datetime.now(UTC),
            "updatedAt": datetime.now(UTC),
        }
        await db.profiles.insert_one(profile)
    else:
        # Check for daily credit refresh
        now = datetime.now(UTC)
        last_refresh = profile.get("lastCreditRefresh")

        if not last_refresh or last_refresh.date() < now.date():
            refresh_amount = 999 if is_admin else 50
            await db.profiles.update_one(
                {"userId": user_id},
                {"$set": {"credits": refresh_amount, "lastCreditRefresh": now}},
            )
            profile["credits"] = refresh_amount
            profile["lastCreditRefresh"] = now

    if profile is None:
        raise HTTPException(
            status_code=500, detail="Failed to create or retrieve profile"
        )

    # For admins, always return a high number if somehow it got low
    if is_admin and profile.get("credits", 0) < 500:
        profile["credits"] = 999

    profile["id"] = str(profile.pop("_id"))
    return profile


@router.post("/{user_id}/deduct")
async def deduct_credits(
    user_id: str, amount: int, db: AgnosticDatabase = Depends(get_db)
):
    logger.info(f"Deducting {amount} credits for user: {user_id}")
    # Ensure profile exists (creates default if missing)
    await get_profile(user_id, db)

    # Admin check - admins get unlimited credits
    if await check_is_admin(user_id, db):
        return {"allowed": True, "remaining": 999}

    # Perform atomic check-and-decrement to prevent race conditions
    res = await db.profiles.update_one(
        {"userId": user_id, "credits": {"$gte": amount}}, {"$inc": {"credits": -amount}}
    )

    profile = await db.profiles.find_one({"userId": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if res.modified_count == 0:
        return {"allowed": False, "remaining": profile.get("credits", 0)}

    return {"allowed": True, "remaining": profile.get("credits", 0)}


@router.post("/")
async def update_profile(
    profile_data: UserProfile, db: AgnosticDatabase = Depends(get_db)
):
    logger.info(f"Updating profile for user: {profile_data.userId}")
    existing = await db.profiles.find_one({"userId": profile_data.userId})

    data = profile_data.model_dump(exclude={"id"})
    data["updatedAt"] = datetime.now(UTC)

    if existing:
        await db.profiles.update_one({"userId": profile_data.userId}, {"$set": data})
    else:
        data["createdAt"] = datetime.now(UTC)
        await db.profiles.insert_one(data)

    updated = await db.profiles.find_one({"userId": profile_data.userId})
    if not updated:
        raise HTTPException(status_code=404, detail="Profile not found after update")
    updated["id"] = str(updated.pop("_id"))
    return updated


class SolvedProblemRequest(BaseModel):
    userLevel: str
    subLevel: int
    problemTitle: str
    problemJson: str
    userPrompt: str


@router.post("/{user_id}/solved-problems")
async def save_solved_problem(
    user_id: str,
    request_data: SolvedProblemRequest,
    db: AgnosticDatabase = Depends(get_db),
):
    query = {
        "userId": user_id,
        "userLevel": request_data.userLevel,
        "subLevel": request_data.subLevel,
        "problemTitle": request_data.problemTitle,
    }
    data = request_data.model_dump()
    data["userId"] = user_id
    data["createdAt"] = datetime.now(UTC)

    await db.solved_problems.replace_one(query, data, upsert=True)
    return {"success": True}


@router.get("/{user_id}/solved-problems")
async def get_solved_problems(user_id: str, db: AgnosticDatabase = Depends(get_db)):
    cursor = db.solved_problems.find({"userId": user_id})
    solved_problems = await cursor.to_list(length=100)
    for sp in solved_problems:
        sp["id"] = str(sp.pop("_id"))
        if "createdAt" in sp and isinstance(sp["createdAt"], datetime):
            sp["createdAt"] = sp["createdAt"].isoformat()
    return solved_problems
