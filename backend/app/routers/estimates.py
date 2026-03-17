import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.ticket import Ticket
from app.models.benefits import BenefitsData
from app.models.estimate import Estimate
from app.schemas.benefits import BenefitsCreate, BenefitsResponse
from app.schemas.estimate import EstimateGenerateRequest, EstimateResponse
from app.services.estimate_engine import EstimateEngine

router = APIRouter()
engine = EstimateEngine()


@router.post("/tickets/{ticket_id}/benefits", response_model=BenefitsResponse, status_code=201)
async def add_benefits(
    ticket_id: uuid.UUID, data: BenefitsCreate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ticket not found")

    benefits = BenefitsData(ticket_id=ticket_id, **data.model_dump())
    db.add(benefits)
    await db.flush()
    await db.refresh(benefits)
    return benefits


@router.post("/estimates/generate", response_model=EstimateResponse, status_code=201)
async def generate_estimate(
    data: EstimateGenerateRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Ticket).where(Ticket.id == data.ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    ben_result = await db.execute(
        select(BenefitsData)
        .where(BenefitsData.ticket_id == data.ticket_id)
        .order_by(BenefitsData.created_at.desc())
        .limit(1)
    )
    benefits = ben_result.scalar_one_or_none()
    if not benefits:
        raise HTTPException(status_code=400, detail="No benefits data available for this ticket")

    charge = data.charge_amount or ticket.charge_amount
    if not charge:
        raise HTTPException(status_code=400, detail="No charge amount provided")

    est = engine.calculate(charge, benefits)
    estimate = Estimate(
        ticket_id=data.ticket_id,
        charge_amount=charge,
        reimbursement_low=est["reimbursement_low"],
        reimbursement_high=est["reimbursement_high"],
        oop_low=est["oop_low"],
        oop_high=est["oop_high"],
        confidence=est["confidence"],
        calculation_details=est["details"],
    )
    db.add(estimate)

    # Generate a share token if the ticket doesn't have one yet
    if not ticket.share_token:
        ticket.share_token = secrets.token_urlsafe(32)

    await db.flush()
    await db.refresh(estimate)
    return estimate


@router.get("/estimates/public/{token}")
async def get_public_estimate(token: str, db: AsyncSession = Depends(get_db)):
    """Public endpoint — no auth required. Used by the patient-facing estimate page."""
    result = await db.execute(select(Ticket).where(Ticket.share_token == token))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Estimate not found")

    est_result = await db.execute(
        select(Estimate)
        .where(Estimate.ticket_id == ticket.id)
        .order_by(Estimate.generated_at.desc())
        .limit(1)
    )
    estimate = est_result.scalar_one_or_none()

    # Return ticket context + estimate (estimate may be None if not yet generated)
    return {
        "token": token,
        "ticket": {
            "id": str(ticket.id),
            "patient_first_name": ticket.patient_name.split()[0] if ticket.patient_name else "there",
            "insurance_company": ticket.insurance_company,
            "provider_name": ticket.provider_name,
            "visit_date": ticket.visit_date.isoformat() if ticket.visit_date else None,
            "charge_amount": float(ticket.charge_amount) if ticket.charge_amount else None,
            "cpt_codes": ticket.cpt_codes or [],
            "diagnosis_codes": ticket.diagnosis_codes or [],
        },
        "estimate": {
            "id": str(estimate.id),
            "reimbursement_low": float(estimate.reimbursement_low),
            "reimbursement_high": float(estimate.reimbursement_high),
            "oop_low": float(estimate.oop_low),
            "oop_high": float(estimate.oop_high),
            "confidence": estimate.confidence,
            "generated_at": estimate.generated_at.isoformat(),
        } if estimate else None,
    }
