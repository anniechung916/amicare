from __future__ import annotations

import asyncio
import logging
from datetime import datetime

import httpx
from sqlalchemy import select

from app.config import get_settings
from app.models.call_log import CallLog, CallStatus
from app.models.ticket import Ticket
from app.services.ws_manager import manager

logger = logging.getLogger("amicare.elevenlabs_call")


class ElevenLabsCallService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def _build_benefits_questions(self, ticket: Ticket) -> str:
        cpt = ", ".join(ticket.cpt_codes or []) if ticket and ticket.cpt_codes else "the relevant procedure codes"
        visit = str(ticket.visit_date) if ticket and ticket.visit_date else "the date of service"
        return (
            f"1. Is the patient's plan active and effective on {visit}?\n"
            f"2. What is the deductible and how much has been met?\n"
            f"3. What is the out-of-pocket maximum and how much has been met?\n"
            f"4. What is the coinsurance/copay for CPT codes {cpt}?\n"
            f"5. Is a referral or prior authorization required?\n"
            f"6. What is the claims mailing address?"
        )

    def _dynamic_variables(self, ticket: Ticket) -> dict:
        return {
            "patient_name": getattr(ticket, "patient_name", None) or "the patient",
            "patient_dob": str(ticket.patient_dob) if ticket and ticket.patient_dob else "unknown",
            "policy_number": getattr(ticket, "policy_number", None) or "N/A",
            "insurance_company": getattr(ticket, "insurance_company", None) or "the insurance company",
            "cpt_codes": ", ".join(ticket.cpt_codes or []) if ticket and ticket.cpt_codes else "the relevant procedure codes",
            "visit_date": str(ticket.visit_date) if ticket and ticket.visit_date else "the date of service",
            "provider_name": getattr(ticket, "provider_name", None) or "our provider",
            "provider_npi": getattr(ticket, "provider_npi", None) or "N/A",
            "benefits_questions": self._build_benefits_questions(ticket),
        }

    async def initiate_outbound_call(self, to_number: str, ticket: Ticket) -> tuple[str, str | None]:
        """Initiate an outbound call via ElevenLabs SDK. Returns (conversation_id, twilio_call_sid)."""
        settings = get_settings()

        from elevenlabs import ElevenLabs
        from elevenlabs.types import ConversationInitiationClientDataRequestInput

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)

        initiation_data = ConversationInitiationClientDataRequestInput(
            dynamic_variables=self._dynamic_variables(ticket),
        )

        # Use the SDK — it picks the right endpoint based on phone number type
        response = await asyncio.to_thread(
            client.conversational_ai.twilio.outbound_call,
            agent_id=settings.elevenlabs_agent_id,
            agent_phone_number_id=settings.elevenlabs_phone_number_id,
            to_number=to_number,
            conversation_initiation_client_data=initiation_data,
        )

        conversation_id = response.conversation_id
        if not conversation_id:
            raise RuntimeError(f"No conversation_id returned: {response}")

        # The Twilio call SID is returned alongside the conversation_id
        twilio_call_sid = getattr(response, "call_sid", None)

        logger.info(f"ElevenLabs outbound call initiated: conversation_id={conversation_id}, twilio_sid={twilio_call_sid}")
        return conversation_id, twilio_call_sid

    async def get_conversation(self, conversation_id: str) -> dict:
        """Fetch conversation status and transcript from ElevenLabs."""
        settings = get_settings()
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/convai/conversations/{conversation_id}",
                headers={"xi-api-key": settings.elevenlabs_api_key},
                timeout=10.0,
            )
            response.raise_for_status()
            return response.json()

    async def monitor_call(self, call_log_id: str, conversation_id: str):
        """Background task: poll ElevenLabs until call ends, update DB and broadcast."""
        from app.database import AsyncSessionLocal

        settings = get_settings()
        # In test mode, cap monitoring to TEST_MODE_MAX_SECONDS; otherwise poll up to 10 min.
        max_polls = (settings.test_mode_max_seconds // 5) if settings.test_mode else 120

        logger.info(f"Monitoring conversation {conversation_id} for call {call_log_id} (max_polls={max_polls})")

        call_ended = False
        for _ in range(max_polls):
            await asyncio.sleep(5)
            try:
                data = await self.get_conversation(conversation_id)
                status = data.get("status")

                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
                    call_log = result.scalar_one_or_none()
                    if not call_log:
                        return

                    # Build transcript from ElevenLabs response
                    items = data.get("transcript", [])
                    if items:
                        lines = []
                        for item in items:
                            role = "Agent" if item.get("role") == "agent" else "Insurance Rep"
                            msg = item.get("message", "").strip()
                            if msg:
                                lines.append(f"[{role}]: {msg}")
                        call_log.transcript = "\n".join(lines)

                    if status == "done":
                        call_log.status = CallStatus.COMPLETED
                        call_log.call_outcome = "success"
                        call_log.ended_at = datetime.utcnow()
                        secs = data.get("call_duration_secs") or data.get("metadata", {}).get("call_duration_secs")
                        if secs:
                            call_log.duration_seconds = int(secs)
                        await db.commit()

                        await manager.broadcast("call:ended", {
                            "call_log_id": call_log_id,
                            "ticket_id": str(call_log.ticket_id),
                            "status": "completed",
                            "outcome": "success",
                            "duration": call_log.duration_seconds,
                            "transcript": call_log.transcript,
                        })
                        logger.info(f"Call {call_log_id} completed")
                        call_ended = True
                        break

                    # Still in progress — broadcast latest transcript
                    await db.commit()
                    if items:
                        await manager.broadcast("call:transcript_update", {
                            "call_log_id": call_log_id,
                            "transcript": call_log.transcript,
                        })

            except Exception as e:
                logger.error(f"Monitor error for {conversation_id}: {e}")

        # Test mode: force-hangup if call is still active after max duration
        if not call_ended and settings.test_mode:
            logger.info(f"Test mode max duration reached for call {call_log_id}, forcing hangup")
            try:
                from app.services.twilio_service import twilio_service
                active_statuses = [
                    CallStatus.QUEUED, CallStatus.RINGING,
                    CallStatus.IN_PROGRESS, CallStatus.ON_HOLD, CallStatus.TRANSFERRING,
                ]
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(CallLog).where(CallLog.id == call_log_id))
                    call_log = result.scalar_one_or_none()
                    if call_log and call_log.status in active_statuses and call_log.call_sid:
                        await asyncio.to_thread(twilio_service.hangup_call, call_log.call_sid)
                        call_log.status = CallStatus.COMPLETED
                        call_log.call_outcome = "test_timeout"
                        call_log.ended_at = datetime.utcnow()
                        await db.commit()
                        await manager.broadcast("call:ended", {
                            "call_log_id": call_log_id,
                            "ticket_id": str(call_log.ticket_id),
                            "status": "completed",
                            "outcome": "test_timeout",
                        })
            except Exception as e:
                logger.error(f"Test mode force-hangup failed for {call_log_id}: {e}")


elevenlabs_call_service = ElevenLabsCallService()
