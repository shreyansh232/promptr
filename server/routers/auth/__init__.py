from fastapi import APIRouter

from routers.auth import credentials, oauth, users

router = APIRouter()

router.include_router(credentials.router, tags=["auth"])
router.include_router(users.router, prefix="/users", tags=["users"])
router.include_router(oauth.router, prefix="/oauth", tags=["oauth"])
