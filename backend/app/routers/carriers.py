import uuid
import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.carrier import InsuranceCarrier
from app.schemas.carrier import CarrierCreate, CarrierUpdate, CarrierResponse

router = APIRouter()

CATEGORY_ORDER = {"National": 0, "Regional": 1, "Regional HMO": 2, "Network Only": 3, "Custom": 4}


@router.get("", response_model=list[CarrierResponse])
async def list_carriers(active_only: bool = True, db: AsyncSession = Depends(get_db)):
    query = select(InsuranceCarrier)
    if active_only:
        query = query.where(InsuranceCarrier.active == True)
    query = query.order_by(InsuranceCarrier.category, InsuranceCarrier.name)
    result = await db.execute(query)
    carriers = list(result.scalars().all())
    carriers.sort(key=lambda c: (CATEGORY_ORDER.get(c.category, 99), c.name))
    return carriers


@router.get("/{carrier_id}", response_model=CarrierResponse)
async def get_carrier(carrier_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InsuranceCarrier).where(InsuranceCarrier.id == carrier_id)
    )
    carrier = result.scalar_one_or_none()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")
    return carrier


@router.post("", response_model=CarrierResponse, status_code=201)
async def create_carrier(data: CarrierCreate, db: AsyncSession = Depends(get_db)):
    key = re.sub(r"[^a-z0-9]", "_", data.name.lower().strip())
    carrier = InsuranceCarrier(
        carrier_key=key,
        name=data.name,
        display_name=data.display_name or data.name,
        category=data.category,
        phone_numbers=data.phone_numbers,
        ivr_navigation=data.ivr_navigation,
        required_info=data.required_info,
        avg_hold_time_minutes=data.avg_hold_time_minutes,
        reference_number_format=data.reference_number_format,
        common_questions=data.common_questions,
        reimbursement_methods=data.reimbursement_methods,
        script_notes=data.script_notes,
        special_considerations=data.special_considerations,
        is_custom=True,
    )
    db.add(carrier)
    await db.flush()
    await db.refresh(carrier)
    return carrier


@router.patch("/{carrier_id}", response_model=CarrierResponse)
async def update_carrier(
    carrier_id: uuid.UUID, data: CarrierUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(InsuranceCarrier).where(InsuranceCarrier.id == carrier_id)
    )
    carrier = result.scalar_one_or_none()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(carrier, key, value)

    await db.flush()
    await db.refresh(carrier)
    return carrier


@router.delete("/{carrier_id}", status_code=204)
async def deactivate_carrier(carrier_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(InsuranceCarrier).where(InsuranceCarrier.id == carrier_id)
    )
    carrier = result.scalar_one_or_none()
    if not carrier:
        raise HTTPException(status_code=404, detail="Carrier not found")
    carrier.active = False
    await db.flush()
