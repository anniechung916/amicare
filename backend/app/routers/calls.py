import asyncio
import uuid
import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, WebSocket
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.ticket import Ticket
from app.models.call_log import CallLog, CallStatus
from app.schemas.call_log import CallLogResponse, CallLogUpdate, CallTriggerRequest, TestCallRequest
from app.services.ws_manager import manager

logger = logging.getLogger("amicare.calls")
router = APIRouter()

ACTIVE_STATUSES = [CallStatus.QUEUED, CallStatus.RINGING, CallStatus.IN_PROGRESS, CallStatus.ON_HOLD, CallStatus.TRANSFERRING]


# --- Call Log response with ticket context ---

class CallLogWithTicket(CallLogResponse):
    patient_name: Optional[str] = None
    insurance_company: Optional[str] = None


def enrich_call_log(call_log: CallLog) -> dict:
    data = CallLogResponse.model_validate(call_log).model_dump()
    if call_log.ticket:
        data["patient_name"] = call_log.ticket.patient_name
        data["insurance_company"] = call_log.ticket.insurance_company
    return data


# --- Trigger a call ---

@router.post("/tickets/{ticket_id}/calls", response_model=CallLogResponse, status_code=201)
async def trigger_call(
    ticket_id: uuid.UUID,
    data: CallTriggerRequest = CallTriggerRequest(),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    phone = data.target_number or ticket.insurance_phone
    if not phone:
        raise HTTPException(status_code=400, detail="No phone number available")

    logger.info(f"Initiating call for ticket {ticket_id} to {phone}")

    call_log = CallLog(
        ticket_id=ticket_id,
        phone_number=phone,
        status=CallStatus.QUEUED,
        current_state="greeting",
        started_at=datetime.utcnow(),
    )
    db.add(call_log)
    await db.flush()
    await db.refresh(call_log)

    # Broadcast call started
    await manager.broadcast("call:started", {
        "call_log_id": str(call_log.id),
        "ticket_id": str(ticket_id),
        "patient_name": ticket.patient_name,
        "insurance_company": ticket.insurance_company,
        "phone_number": phone,
        "started_at": call_log.started_at.isoformat(),
        "status": "queued",
    })

    # Initiate Twilio call
    from app.services.call_orchestrator import call_orchestrator
    try:
        await call_orchestrator.initiate_call(call_log, ticket, db)
        logger.info(f"Call initiated successfully: {call_log.call_sid}")
    except Exception as e:
        logger.error(f"Call initiation failed: {e}")
        call_log.status = CallStatus.FAILED
        call_log.call_outcome = "failed"
        call_log.admin_notes = str(e)
        call_log.ended_at = datetime.utcnow()
        await db.flush()

        await manager.broadcast("call:ended", {
            "call_log_id": str(call_log.id),
            "ticket_id": str(ticket_id),
            "status": "failed",
            "error": str(e),
        })

    await db.refresh(call_log)
    return call_log


# --- Test call endpoint ---

@router.post("/test-call", response_model=CallLogResponse, status_code=201)
async def test_call(data: TestCallRequest, db: AsyncSession = Depends(get_db)):
    """Make a test call to verify Twilio pipeline. Creates a temporary ticket."""
    from app.services.twilio_service import twilio_service

    # Verify Twilio credentials first
    try:
        logger.info("Testing Twilio credentials...")
        account = twilio_service.client.api.accounts(twilio_service.account_sid).fetch()
        logger.info(f"Twilio connected: {account.friendly_name}")
    except Exception as e:
        logger.error(f"Twilio connection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Twilio connection failed: {str(e)}")

    # Create test ticket
    test_ticket = Ticket(
        patient_name="TEST CALL",
        insurance_company="Test Insurance",
        insurance_phone=data.phone_number,
        notes="Automated test call",
    )
    db.add(test_ticket)
    await db.flush()

    call_log = CallLog(
        ticket_id=test_ticket.id,
        phone_number=data.phone_number,
        status=CallStatus.QUEUED,
        current_state="greeting",
        started_at=datetime.utcnow(),
        admin_notes="Test call",
    )
    db.add(call_log)
    await db.flush()

    try:
        call_sid = twilio_service.initiate_call(
            to_number=data.phone_number,
            call_log_id=str(call_log.id),
        )
        call_log.call_sid = call_sid
        call_log.status = CallStatus.RINGING
        logger.info(f"Test call initiated: SID={call_sid}")
    except Exception as e:
        call_log.status = CallStatus.FAILED
        call_log.call_outcome = "failed"
        call_log.admin_notes = f"Test call failed: {str(e)}"
        logger.error(f"Test call failed: {e}")

    await db.flush()
    await db.refresh(call_log)
    return call_log


# --- Twilio health check ---

@router.get("/twilio/health")
async def twilio_health():
    from app.services.twilio_service import twilio_service
    from app.config import get_settings
    settings = get_settings()

    result = {
        "account_sid": "Set" if settings.twilio_account_sid else "MISSING",
        "auth_token": "Set" if settings.twilio_auth_token else "MISSING",
        "phone_number": settings.twilio_phone_number or "MISSING",
        "webhook_base_url": settings.twilio_webhook_base_url,
    }

    try:
        account = twilio_service.client.api.accounts(settings.twilio_account_sid).fetch()
        result["connection"] = "OK"
        result["account_name"] = account.friendly_name
    except Exception as e:
        result["connection"] = f"FAILED: {str(e)}"

    return result


# --- List call logs (with ticket info) ---

@router.get("/call-logs")
async def list_call_logs(
    ticket_id: Optional[uuid.UUID] = None,
    status: Optional[CallStatus] = None,
    active_only: bool = False,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(CallLog).options(selectinload(CallLog.ticket))

    if ticket_id:
        query = query.where(CallLog.ticket_id == ticket_id)
    if status:
        query = query.where(CallLog.status == status)
    if active_only:
        query = query.where(CallLog.status.in_(ACTIVE_STATUSES))
    if search:
        query = query.join(Ticket).where(
            or_(
                Ticket.patient_name.ilike(f"%{search}%"),
                CallLog.reference_number.ilike(f"%{search}%"),
            )
        )

    query = query.order_by(CallLog.created_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    call_logs = result.scalars().all()

    return [enrich_call_log(cl) for cl in call_logs]


# --- Get active calls ---

@router.get("/call-logs/active")
async def get_active_calls(db: AsyncSession = Depends(get_db)):
    query = (
        select(CallLog)
        .options(selectinload(CallLog.ticket))
        .where(CallLog.status.in_(ACTIVE_STATUSES))
        .order_by(CallLog.started_at.desc())
    )
    result = await db.execute(query)
    return [enrich_call_log(cl) for cl in result.scalars().all()]


# --- Get single call log ---

@router.get("/call-logs/{call_log_id}")
async def get_call_log(call_log_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CallLog).options(selectinload(CallLog.ticket)).where(CallLog.id == call_log_id)
    )
    call_log = result.scalar_one_or_none()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")
    return enrich_call_log(call_log)


# --- Update call log (rep name, ref #, notes) ---

@router.patch("/call-logs/{call_log_id}", response_model=CallLogResponse)
async def update_call_log(
    call_log_id: uuid.UUID, data: CallLogUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
    call_log = result.scalar_one_or_none()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(call_log, key, value)

    await db.flush()
    await db.refresh(call_log)
    return call_log


# --- Hang up an active call ---

@router.post("/call-logs/{call_log_id}/hangup")
async def hangup_call(call_log_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
    call_log = result.scalar_one_or_none()
    if not call_log:
        raise HTTPException(status_code=404, detail="Call log not found")

    if call_log.status not in ACTIVE_STATUSES:
        raise HTTPException(status_code=400, detail="Call is not active")

    twilio_sid = call_log.call_sid
    if not twilio_sid:
        raise HTTPException(status_code=400, detail="No Twilio call SID available to hang up")

    try:
        from app.services.twilio_service import twilio_service
        await asyncio.to_thread(twilio_service.hangup_call, twilio_sid)
        logger.info(f"Hung up call {call_log_id} (Twilio SID: {twilio_sid})")
    except Exception as e:
        logger.error(f"Hangup failed for {call_log_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Hangup failed: {str(e)}")

    call_log.status = CallStatus.COMPLETED
    call_log.call_outcome = "hung_up"
    call_log.ended_at = datetime.utcnow()
    await db.flush()

    await manager.broadcast("call:ended", {
        "call_log_id": str(call_log.id),
        "ticket_id": str(call_log.ticket_id),
        "status": "completed",
        "outcome": "hung_up",
    })

    return {"ok": True, "call_log_id": str(call_log_id)}


# --- Twilio webhook endpoints ---

@router.post("/calls/twiml/{call_log_id}")
async def twiml_handler(call_log_id: uuid.UUID, request: Request):
    """Return TwiML that connects the call to ElevenLabs via a media stream."""
    from app.config import get_settings
    settings = get_settings()

    logger.info(f"TwiML request for call {call_log_id}")

    # Convert http(s) base URL to ws(s) for Twilio Stream
    base = settings.twilio_webhook_base_url
    ws_base = base.replace("https://", "wss://").replace("http://", "ws://")
    stream_url = f"{ws_base}/api/calls/stream/{call_log_id}"

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        "<Connect>"
        f'<Stream url="{stream_url}"/>'
        "</Connect>"
        "</Response>"
    )
    return Response(content=twiml, media_type="application/xml")


@router.websocket("/calls/stream/{call_log_id}")
async def media_stream_ws(
    websocket: WebSocket,
    call_log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """WebSocket bridge: Twilio media stream ↔ ElevenLabs Conversational AI."""
    await websocket.accept()

    result = await db.execute(
        select(CallLog).options(selectinload(CallLog.ticket)).where(CallLog.id == call_log_id)
    )
    call_log = result.scalar_one_or_none()
    if not call_log:
        await websocket.close()
        return

    ticket = call_log.ticket
    logger.info(f"Media stream WebSocket opened for call {call_log_id}")

    from app.services.elevenlabs_bridge import elevenlabs_bridge
    await elevenlabs_bridge.run(websocket, call_log, ticket, db)

    logger.info(f"Media stream WebSocket closed for call {call_log_id}")


@router.post("/calls/status/{call_log_id}")
async def status_callback(call_log_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    form_data = await request.form()
    call_status = form_data.get("CallStatus", "")
    duration = form_data.get("CallDuration", "0")
    call_sid = form_data.get("CallSid", "")

    logger.info(f"Status callback for {call_log_id}: {call_status} (duration={duration})")

    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
    call_log = result.scalar_one_or_none()
    if not call_log:
        return {"ok": True}

    if call_sid and not call_log.call_sid:
        call_log.call_sid = call_sid

    status_map = {
        "queued": CallStatus.QUEUED,
        "ringing": CallStatus.RINGING,
        "in-progress": CallStatus.IN_PROGRESS,
        "completed": CallStatus.COMPLETED,
        "failed": CallStatus.FAILED,
        "no-answer": CallStatus.NO_ANSWER,
        "busy": CallStatus.BUSY,
    }

    if call_status in status_map:
        call_log.status = status_map[call_status]

    if call_status == "completed":
        call_log.ended_at = datetime.utcnow()
        call_log.duration_seconds = int(duration) if duration else 0
        call_log.call_outcome = "success"

        await manager.broadcast("call:ended", {
            "call_log_id": str(call_log.id),
            "ticket_id": str(call_log.ticket_id),
            "ended_at": call_log.ended_at.isoformat(),
            "duration": call_log.duration_seconds,
            "outcome": "success",
            "recording_url": call_log.recording_url,
        })
    elif call_status in ("failed", "no-answer", "busy"):
        call_log.ended_at = datetime.utcnow()
        call_log.call_outcome = call_status

        await manager.broadcast("call:ended", {
            "call_log_id": str(call_log.id),
            "ticket_id": str(call_log.ticket_id),
            "status": call_status,
            "outcome": call_status,
        })
    else:
        await manager.broadcast("call:status_update", {
            "call_log_id": str(call_log.id),
            "ticket_id": str(call_log.ticket_id),
            "status": call_log.status.value,
        })

    await db.flush()
    return {"ok": True}


@router.post("/calls/recording/{call_log_id}")
async def recording_callback(call_log_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    form_data = await request.form()
    recording_url = form_data.get("RecordingUrl", "")
    recording_sid = form_data.get("RecordingSid", "")

    logger.info(f"Recording callback for {call_log_id}: {recording_url}")

    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
    call_log = result.scalar_one_or_none()
    if call_log and recording_url:
        call_log.recording_url = recording_url + ".mp3"
        await db.flush()

        await manager.broadcast("call:recording_ready", {
            "call_log_id": str(call_log.id),
            "recording_url": call_log.recording_url,
        })

    return {"ok": True}
