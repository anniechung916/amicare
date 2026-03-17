import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Text, Integer, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BenefitsData(Base):
    __tablename__ = "benefits_data"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id"))
    call_log_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("call_logs.id"), nullable=True
    )
    deductible_individual: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    deductible_met: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    oop_max: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    coinsurance_percentage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reimbursement_method: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extracted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket = relationship("Ticket", back_populates="benefits")
    call_log = relationship("CallLog")
