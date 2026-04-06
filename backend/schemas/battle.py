from pydantic import BaseModel
from typing import Optional, List


class CreateBattleRequest(BaseModel):
    title: str
    description: str
    goal: str
    testCases: list[dict]  # [{ input, expectedOutput, description }]


class BattleGenerationRequest(BaseModel):
    title: str
    description: str


class BattleGenerationResponse(BaseModel):
    goal: str
    testCases: list[dict]


class JoinBattleRequest(BaseModel):
    battleId: str


class SubmitPromptRequest(BaseModel):
    battleId: str
    prompt: str


class BattleTestCase(BaseModel):
    input: str
    expectedOutput: str
    description: str


class BattleParticipantResponse(BaseModel):
    userId: str
    userName: Optional[str] = None
    userEmail: Optional[str] = None
    prompt: Optional[str] = None
    tokenCount: Optional[int] = None
    score: Optional[int] = None
    passed: Optional[bool] = None
    result: Optional[str] = None
    eloChange: Optional[int] = None
    submittedAt: Optional[str] = None


class BattleResponse(BaseModel):
    id: str
    title: str
    description: str
    goal: str
    testCases: list[dict]
    status: str
    createdBy: str
    opponentId: Optional[str] = None
    participants: List[BattleParticipantResponse] = []
    createdAt: str
    updatedAt: str


class BattleListResponse(BaseModel):
    battles: List[BattleResponse]


class BattleResultResponse(BaseModel):
    battleId: str
    status: str
    participants: List[BattleParticipantResponse]
    winner: Optional[str] = None  # userId of winner, or None for draw


class EloExchangeResponse(BaseModel):
    winner: str
    loser: str
    winnerEloChange: int
    loserEloChange: int
    winnerNewElo: int
    loserNewElo: int
