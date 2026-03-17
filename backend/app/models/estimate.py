import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, DateTime, Numeric, JSON, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Estimate(Base):
    __tablename__ = "estimates"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ticket_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tickets.id"))
    charge_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    reimbursement_low: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    reimbursement_high: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    oop_low: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    oop_high: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    confidence: Mapped[str] = mapped_column(String(20), default="medium")
    calculation_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    ticket = relationship("Ticket", back_populates="estimates")
