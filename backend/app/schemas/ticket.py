from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.ticket import TicketStatus
from app.schemas.call_log import CallLogResponse
from app.schemas.benefits import BenefitsResponse
from app.schemas.estimate import EstimateResponse
from app.schemas.file_upload import FileUploadResponse
from app.schemas.carrier import CarrierResponse


class TicketCreate(BaseModel):
    patient_name: str
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_dob: Optional[date] = None
    carrier_id: Optional[UUID] = None
    insurance_company: str
    insurance_phone: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None
    provider_name: Optional[str] = None
    provider_npi: Optional[str] = None
    visit_date: Optional[date] = None
    cpt_codes: Optional[list[str]] = None
    charge_amount: Optional[Decimal] = None
    notes: Optional[str] = None


class TicketUpdate(BaseModel):
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    patient_phone: Optional[str] = None
    patient_dob: Optional[date] = None
    carrier_id: Optional[UUID] = None
    insurance_company: Optional[str] = None
    insurance_phone: Optional[str] = None
    policy_number: Optional[str] = None
    group_number: Optional[str] = None
    provider_name: Optional[str] = None
    provider_npi: Optional[str] = None
    visit_date: Optional[date] = None
    cpt_codes: Optional[list[str]] = None
    charge_amount: Optional[Decimal] = None
    status: Optional[TicketStatus] = None
    notes: Optional[str] = None


class TicketResponse(BaseModel):
    id: UUID
    carrier_id: Optional[UUID]
    patient_name: str
    patient_email: Optional[str]
    patient_phone: Optional[str]
    patient_dob: Optional[date]
    insurance_company: str
    insurance_phone: Optional[str]
    policy_number: Optional[str]
    group_number: Optional[str]
    provider_name: Optional[str]
    provider_npi: Optional[str]
    visit_date: Optional[date]
    cpt_codes: Optional[list[str]]
    charge_amount: Optional[Decimal]
    status: TicketStatus
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TicketDetailResponse(TicketResponse):
    carrier: Optional[CarrierResponse] = None
    call_logs: list[CallLogResponse] = []
    benefits: list[BenefitsResponse] = []
    estimates: list[EstimateResponse] = []
    file_uploads: list[FileUploadResponse] = []


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    page: int
    per_page: int
