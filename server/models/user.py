import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=True)
    image: Mapped[str] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    oauth_accounts: Mapped[list["OAuthAccount"]] = relationship(
        "OAuthAccount", back_populates="user", cascade="all, delete-orphan"
    )
    profile: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    completed_missions: Mapped[list["CompletedMission"]] = relationship(
        "CompletedMission", back_populates="user", cascade="all, delete-orphan"
    )
    custom_scenarios: Mapped[list["CustomScenario"]] = relationship(
        "CustomScenario", back_populates="user", cascade="all, delete-orphan"
    )


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    provider_account_id: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="oauth_accounts")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    level: Mapped[str] = mapped_column(String(50), default="beginner")
    expertise: Mapped[str] = mapped_column(String(255), default="")
    application: Mapped[str] = mapped_column(String(255), default="")
    goals: Mapped[dict] = mapped_column(JSONB, default=list)
    builder_role: Mapped[str] = mapped_column(String(255), default="")
    frameworks: Mapped[dict] = mapped_column(JSONB, default=list)
    workflow_focus: Mapped[str] = mapped_column(String(255), default="")
    risk_focus: Mapped[str] = mapped_column(String(255), default="")
    sub_level: Mapped[int] = mapped_column(Integer, default=1)
    problems_solved: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user: Mapped["User"] = relationship("User", back_populates="profile")


class CompletedMission(Base):
    __tablename__ = "completed_missions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    mission_id: Mapped[str] = mapped_column(String(255), nullable=False)
    user_level: Mapped[str] = mapped_column(String(50), nullable=False)
    sub_level: Mapped[int] = mapped_column(Integer, nullable=False)
    mission_title: Mapped[str] = mapped_column(String(255), nullable=False)
    mission_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    user_instructions: Mapped[str] = mapped_column(String, nullable=False)
    reliability_score: Mapped[int] = mapped_column(Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tool_trajectory: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    results: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user: Mapped["User"] = relationship("User", back_populates="completed_missions")


class CustomScenario(Base):
    __tablename__ = "custom_scenarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    goal: Mapped[str] = mapped_column(String, nullable=False)
    agent_description: Mapped[str] = mapped_column(String, nullable=False)
    tools: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    examples: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    test_cases: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    pro_tips: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    tags: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    hint: Mapped[str] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user: Mapped["User"] = relationship("User", back_populates="custom_scenarios")
