import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, Boolean, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InsuranceCarrier(Base):
    __tablename__ = "insurance_carriers"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    carrier_key: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(255))
    category: Mapped[str] = mapped_column(String(50))
    phone_numbers: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ivr_navigation: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    required_info: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    avg_hold_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    reference_number_format: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    common_questions: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    reimbursement_methods: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    script_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    special_considerations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
