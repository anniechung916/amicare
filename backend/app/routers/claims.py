from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.estimate import Estimate
from app.models.ticket import Ticket, TicketStatus

router = APIRouter(prefix="/api/claims", tags=["claims"])


@router.post("/submit/{token}")
async def submit_claim(token: str, db: AsyncSession = Depends(get_db)):
    """
    Public endpoint — no auth required (patient submits from their phone).
    Marks the ticket as CLAIM_SUBMITTED and returns pre-filled claim info.
    Idempotent: calling twice returns the same result.
    """
    result = await db.execute(select(Ticket).where(Ticket.share_token == token))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Estimate link not found")

    # Get latest estimate
    est_result = await db.execute(
        select(Estimate)
        .where(Estimate.ticket_id == ticket.id)
        .order_by(Estimate.generated_at.desc())
        .limit(1)
    )
    estimate = est_result.scalar_one_or_none()

    # Mark ticket as claim submitted (idempotent)
    if ticket.status != TicketStatus.CLAIM_SUBMITTED:
        ticket.status = TicketStatus.CLAIM_SUBMITTED
        await db.flush()

    # Return everything needed to display the claim summary and guide patient
    return {
        "status": "submitted",
        "ticket": {
            "patient_name": ticket.patient_name,
            "patient_dob": ticket.patient_dob.isoformat() if ticket.patient_dob else None,
            "insurance_company": ticket.insurance_company,
            "policy_number": ticket.policy_number,
            "group_number": ticket.group_number,
            "provider_name": ticket.provider_name,
            "provider_npi": ticket.provider_npi,
            "visit_date": ticket.visit_date.isoformat() if ticket.visit_date else None,
            "cpt_codes": ticket.cpt_codes or [],
            "diagnosis_codes": ticket.diagnosis_codes or [],
            "charge_amount": float(ticket.charge_amount) if ticket.charge_amount else None,
        },
        "estimate": {
            "oop_low": float(estimate.oop_low),
            "oop_high": float(estimate.oop_high),
            "reimbursement_low": float(estimate.reimbursement_low),
            "reimbursement_high": float(estimate.reimbursement_high),
        } if estimate else None,
        "insurer_portal": _insurer_portal(ticket.insurance_company),
    }


# Common insurer member portal URLs for claim submission
_INSURER_PORTALS = {
    "aetna": ("Aetna Member Website", "https://www.aetna.com/individuals-families/member-website.html"),
    "cigna": ("MyCigna", "https://my.cigna.com"),
    "united": ("MyUHC", "https://www.myuhc.com"),
    "unitedhealthcare": ("MyUHC", "https://www.myuhc.com"),
    "bcbs": ("Blue Cross Blue Shield", "https://www.bcbs.com/find-care/member-portal"),
    "anthem": ("Anthem Member Portal", "https://www.anthem.com/individual-and-family/member-resources/"),
    "humana": ("MyHumana", "https://www.humana.com/member"),
    "kaiser": ("Kaiser Permanente", "https://healthy.kaiserpermanente.org"),
    "oscar": ("Oscar Health", "https://www.hioscar.com/claims"),
    "oxford": ("Oxford Member Portal", "https://www.oxhp.com"),
}


def _insurer_portal(insurance_company: str | None) -> dict:
    if not insurance_company:
        return {"name": "your insurer's website", "url": None}
    key = insurance_company.lower()
    for k, (name, url) in _INSURER_PORTALS.items():
        if k in key:
            return {"name": name, "url": url}
    return {"name": f"{insurance_company} member portal", "url": None}
