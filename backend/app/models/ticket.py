import uuid
import enum
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import String, Text, Date, DateTime, Enum, JSON, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.services.encryption import EncryptedString


class TicketStatus(str, enum.Enum):
    PENDING_ESTIMATE = "pending_estimate"
    ESTIMATE_GENERATED = "estimate_generated"
    CLAIM_SUBMITTED = "claim_submitted"
    CALLING_INSURER = "calling_insurer"
    AWAITING_PAYMENT = "awaiting_payment"
    RESOLVED = "resolved"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    carrier_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("insurance_carriers.id"), nullable=True
    )
    patient_name: Mapped[str] = mapped_column(String(255))
    patient_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    patient_phone: Mapped[Optional[str]] = mapped_column(EncryptedString(500), nullable=True)
    patient_dob: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    insurance_company: Mapped[str] = mapped_column(String(255))
    insurance_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    policy_number: Mapped[Optional[str]] = mapped_column(EncryptedString(500), nullable=True)
    group_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provider_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    provider_npi: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    visit_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    cpt_codes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    charge_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus), default=TicketStatus.PENDING_ESTIMATE
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diagnosis_codes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    share_token: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    carrier = relationship("InsuranceCarrier", lazy="selectin")
    call_logs = relationship("CallLog", back_populates="ticket", lazy="selectin")
    benefits = relationship("BenefitsData", back_populates="ticket", lazy="selectin")
    estimates = relationship("Estimate", back_populates="ticket", lazy="selectin")
    file_uploads = relationship("FileUpload", back_populates="ticket", lazy="selectin")
