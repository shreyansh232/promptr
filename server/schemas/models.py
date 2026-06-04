from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class UserProfile(BaseModel):
    userId: str
    level: str = "beginner"
    subLevel: int = 1
    problemsSolved: int = 0
    streak: int = 0
    expertise: str = "general"
    application: str = ""
    goals: List[str] = []
    builderRole: str = ""
    frameworks: List[str] = []
    workflowFocus: str = ""
    riskFocus: str = ""
    credits: int = 50
    lastCreditRefresh: Optional[datetime] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Problem(BaseModel):
    title: str
    description: str
    difficulty: str = "EASY"
    goal: Optional[str] = None
    proTips: List[str] = []
    testCases: List[dict] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Submission(BaseModel):
    userId: str
    problemId: str
    prompt: str
    score: int
    allPassed: bool
    feedback: str
    status: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class SolvedProblem(BaseModel):
    userId: str
    userLevel: str
    subLevel: int
    problemTitle: str
    problemJson: str
    userPrompt: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)
