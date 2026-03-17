from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.call_log import CallStatus


class CallLogResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    call_sid: Optional[str]
    phone_number: str
    status: CallStatus
    duration_seconds: Optional[int]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    recording_url: Optional[str]
    transcript: Optional[str]
    summary: Optional[str]
    reference_numbers: Optional[list]
    notes: Optional[str]
    rep_name: Optional[str]
    reference_number: Optional[str]
    admin_notes: Optional[str]
    call_outcome: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CallLogUpdate(BaseModel):
    rep_name: Optional[str] = None
    reference_number: Optional[str] = None
    admin_notes: Optional[str] = None
    call_outcome: Optional[str] = None
    notes: Optional[str] = None


class CallTriggerRequest(BaseModel):
    target_number: Optional[str] = None


class TestCallRequest(BaseModel):
    phone_number: str
