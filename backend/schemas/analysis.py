from pydantic import BaseModel

try:
    from backend.schemas.user import UserType
except ImportError:
    from schemas.user import UserType


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    user_type: UserType
