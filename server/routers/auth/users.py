from typing import Annotated

from fastapi import APIRouter, Depends

from core.security import get_current_user
from models.user import User
from schemas.auth import UserResponse

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
