import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, DateTime, Enum, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CallStatus(str, enum.Enum):
    QUEUED = "queued"
    RINGING = "ringing"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    TRANSFERRING = "transferring"
    COMPLETED = "completed"
    FAILED = "failed"
    NO_ANSWER = "no_answer"
    VOICEMAIL = "voicemail"
    BUSY = "busy"


class CallLog(Base):
    __tablename__ = "call_logs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id"))
    call_sid: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone_number: Mapped[str] = mapped_column(String(50))
    status: Mapped[CallStatus] = mapped_column(Enum(CallStatus), default=CallStatus.QUEUED)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    recording_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    transcript: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reference_numbers: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_state: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    # New fields
    rep_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reference_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    call_outcome: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket = relationship("Ticket", back_populates="call_logs")
