from typing import List
from pydantic import BaseModel


class UserType(BaseModel):
    userId: str = ""
    level: str
    expertise: str
    application: str = ""
    learning_style: str = ""
    goals: List[str]
    subLevel: int = 1
