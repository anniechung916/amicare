from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BenefitsCreate(BaseModel):
    deductible_individual: Optional[Decimal] = None
    deductible_met: Optional[Decimal] = None
    oop_max: Optional[Decimal] = None
    coinsurance_percentage: Optional[int] = None
    reimbursement_method: Optional[str] = None
    notes: Optional[str] = None


class BenefitsResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    call_log_id: Optional[UUID]
    deductible_individual: Optional[Decimal]
    deductible_met: Optional[Decimal]
    oop_max: Optional[Decimal]
    coinsurance_percentage: Optional[int]
    reimbursement_method: Optional[str]
    notes: Optional[str]
    extracted_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}
