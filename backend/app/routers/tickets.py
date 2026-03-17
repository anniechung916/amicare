import asyncio
import secrets
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.estimate import Estimate
from app.models.ticket import Ticket, TicketStatus
from app.schemas.ticket import (
    TicketCreate,
    TicketUpdate,
    TicketResponse,
    TicketDetailResponse,
    TicketListResponse,
)

router = APIRouter()


@router.post("", response_model=TicketResponse, status_code=201)
async def create_ticket(data: TicketCreate, db: AsyncSession = Depends(get_db)):
    ticket = Ticket(**data.model_dump())
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return ticket


@router.get("", response_model=TicketListResponse)
async def list_tickets(
    status: Optional[TicketStatus] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Ticket)
    count_query = select(sa_func.count(Ticket.id))

    if status:
        query = query.where(Ticket.status == status)
        count_query = count_query.where(Ticket.status == status)
    if search:
        query = query.where(Ticket.patient_name.ilike(f"%{search}%"))
        count_query = count_query.where(Ticket.patient_name.ilike(f"%{search}%"))

    total = (await db.execute(count_query)).scalar() or 0

    query = query.order_by(Ticket.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    tickets = result.scalars().all()

    return TicketListResponse(items=tickets, total=total, page=page, per_page=per_page)


@router.get("/{ticket_id}", response_model=TicketDetailResponse)
async def get_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: uuid.UUID, data: TicketUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ticket, key, value)

    await db.flush()
    await db.refresh(ticket)
    return ticket


@router.delete("/{ticket_id}", status_code=204)
async def delete_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await db.delete(ticket)


@router.post("/{ticket_id}/notify")
async def notify_patient(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Generate a share token and send the patient their estimate link via SMS + email."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    # Check an estimate exists
    est_result = await db.execute(
        select(Estimate).where(Estimate.ticket_id == ticket_id).limit(1)
    )
    if not est_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Generate an estimate first before notifying the patient")

    # Ensure share token exists
    if not ticket.share_token:
        ticket.share_token = secrets.token_urlsafe(32)
        await db.flush()

    # Fire notifications in background (non-blocking)
    from app.services.notification_service import notification_service
    asyncio.create_task(
        notification_service.send_estimate_notification(ticket)
    )

    return {"share_token": ticket.share_token}

