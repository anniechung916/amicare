from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class EstimateGenerateRequest(BaseModel):
    ticket_id: UUID
    charge_amount: Optional[Decimal] = None


class EstimateResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    charge_amount: Decimal
    reimbursement_low: Decimal
    reimbursement_high: Decimal
    oop_low: Decimal
    oop_high: Decimal
    confidence: str
    calculation_details: Optional[dict]
    generated_at: datetime

    model_config = {"from_attributes": True}
