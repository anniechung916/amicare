import asyncio
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ticket import Ticket
from app.models.call_log import CallLog, CallStatus
from app.services.ws_manager import manager

logger = logging.getLogger("amicare.call_orchestrator")


class CallOrchestrator:
    async def initiate_call(self, call_log: CallLog, ticket: Ticket, db: AsyncSession):
        from app.services.elevenlabs_call_service import elevenlabs_call_service

        try:
            conversation_id, twilio_call_sid = await elevenlabs_call_service.initiate_outbound_call(
                to_number=call_log.phone_number,
                ticket=ticket,
            )

            # Store Twilio call SID for hangup; ElevenLabs conversation_id in summary for reference
            call_log.call_sid = twilio_call_sid or conversation_id
            call_log.summary = conversation_id  # temporary: store so monitor_call can be re-associated if needed
            call_log.status = CallStatus.IN_PROGRESS
            call_log.started_at = datetime.utcnow()
            await db.flush()

            await manager.broadcast("call:status_update", {
                "ticket_id": str(call_log.ticket_id),
                "call_log_id": str(call_log.id),
                "status": "in_progress",
            })

            # Start background polling for transcript + completion
            asyncio.create_task(
                elevenlabs_call_service.monitor_call(str(call_log.id), conversation_id)
            )

            logger.info(f"ElevenLabs call started: conversation_id={conversation_id}, twilio_sid={twilio_call_sid}")

        except Exception as e:
            call_log.status = CallStatus.FAILED
            call_log.admin_notes = f"Failed to initiate: {str(e)}"
            await db.flush()
            raise


call_orchestrator = CallOrchestrator()
