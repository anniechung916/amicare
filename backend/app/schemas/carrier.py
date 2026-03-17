from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class CarrierCreate(BaseModel):
    name: str
    display_name: Optional[str] = None
    category: str = "Custom"
    phone_numbers: Optional[dict] = None
    ivr_navigation: Optional[dict] = None
    required_info: Optional[list[str]] = None
    avg_hold_time_minutes: Optional[int] = None
    reference_number_format: Optional[str] = None
    common_questions: Optional[list[str]] = None
    reimbursement_methods: Optional[list[str]] = None
    script_notes: Optional[str] = None
    special_considerations: Optional[str] = None


class CarrierUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    category: Optional[str] = None
    phone_numbers: Optional[dict] = None
    ivr_navigation: Optional[dict] = None
    required_info: Optional[list[str]] = None
    avg_hold_time_minutes: Optional[int] = None
    reference_number_format: Optional[str] = None
    common_questions: Optional[list[str]] = None
    reimbursement_methods: Optional[list[str]] = None
    script_notes: Optional[str] = None
    special_considerations: Optional[str] = None
    active: Optional[bool] = None


class CarrierResponse(BaseModel):
    id: UUID
    carrier_key: str
    name: str
    display_name: str
    category: str
    phone_numbers: Optional[dict]
    ivr_navigation: Optional[dict]
    required_info: Optional[list[str]]
    avg_hold_time_minutes: Optional[int]
    reference_number_format: Optional[str]
    common_questions: Optional[list[str]]
    reimbursement_methods: Optional[list[str]]
    script_notes: Optional[str]
    special_considerations: Optional[str]
    is_custom: bool
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
