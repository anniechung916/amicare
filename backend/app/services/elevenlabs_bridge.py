import asyncio
import json
import logging
from datetime import datetime

import websockets

from app.config import get_settings
from app.models.call_log import CallLog
from app.models.ticket import Ticket
from app.services.ws_manager import manager

logger = logging.getLogger("amicare.elevenlabs_bridge")


async def _append_transcript(call_log: CallLog, db, speaker: str, text: str):
    timestamp = datetime.utcnow().strftime("%I:%M:%S %p")
    existing = call_log.transcript or ""
    call_log.transcript = existing + f"\n[{timestamp}] {speaker}: {text}"
    await db.flush()
    await manager.broadcast("call:transcript_update", {
        "call_log_id": str(call_log.id),
        "timestamp": timestamp,
        "speaker": "agent" if speaker == "Agent" else "human",
        "message": text,
    })


def _build_benefits_questions(ticket: Ticket) -> str:
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


class ElevenLabsBridge:
    """Bridges audio between Twilio Media Streams and ElevenLabs Conversational AI."""

    async def run(self, twilio_ws, call_log: CallLog, ticket: Ticket, db):
        settings = get_settings()
        agent_id = settings.elevenlabs_agent_id
        api_key = settings.elevenlabs_api_key

        if not agent_id or not api_key:
            logger.error("ElevenLabs agent credentials not configured")
            await twilio_ws.close()
            return

        el_url = f"wss://api.elevenlabs.io/v1/convai/conversation?agent_id={agent_id}"
        stream_sid = {"value": None}
        # call_sid is needed to send DTMF / transfer via Twilio REST — captured from
        # the Twilio "start" event (most reliable) or from call_log as a fallback.
        call_sid = {"value": call_log.call_sid}

        try:
            async with websockets.connect(
                el_url,
                additional_headers={"xi-api-key": api_key},
            ) as el_ws:
                # Send patient context as dynamic variables so the agent knows who it's calling for
                init_msg = {
                    "type": "conversation_initiation_client_data",
                    "dynamic_variables": {
                        "patient_name": getattr(ticket, "patient_name", None) or "the patient",
                        "patient_dob": str(ticket.patient_dob) if ticket and ticket.patient_dob else "unknown",
                        "policy_number": getattr(ticket, "policy_number", None) or "N/A",
                        "insurance_company": getattr(ticket, "insurance_company", None) or "the insurance company",
                        "cpt_codes": ", ".join(ticket.cpt_codes or []) if ticket and ticket.cpt_codes else "the relevant procedure codes",
                        "visit_date": str(ticket.visit_date) if ticket and ticket.visit_date else "the date of service",
                        "provider_name": getattr(ticket, "provider_name", None) or "our provider",
                        "provider_npi": getattr(ticket, "provider_npi", None) or "N/A",
                        "benefits_questions": _build_benefits_questions(ticket),
                    },
                    "conversation_config_override": {
                        "tts": {
                            "voice_id": settings.elevenlabs_voice_id or None,
                        }
                    },
                }
                await el_ws.send(json.dumps(init_msg))
                logger.info(f"ElevenLabs session started for call {call_log.id}")

                async def twilio_to_el():
                    """Forward inbound audio Twilio → ElevenLabs."""
                    try:
                        async for raw in twilio_ws.iter_text():
                            data = json.loads(raw)
                            event = data.get("event")

                            if event == "start":
                                stream_sid["value"] = data["start"]["streamSid"]
                                # Capture call SID from Twilio start event for DTMF / transfer
                                if not call_sid["value"]:
                                    call_sid["value"] = data["start"].get("callSid")
                                logger.info(f"Twilio stream started: {stream_sid['value']}, call SID: {call_sid['value']}")
                            elif event == "media":
                                payload = data["media"]["payload"]
                                await el_ws.send(json.dumps({"user_audio_chunk": payload}))
                            elif event == "stop":
                                logger.info(f"Twilio stream stopped for call {call_log.id}")
                                break
                    except Exception as e:
                        logger.error(f"twilio_to_el error: {e}")
                    finally:
                        await el_ws.close()

                async def el_to_twilio():
                    """Forward ElevenLabs audio → Twilio, capture transcripts, handle tool calls."""
                    from app.services.twilio_service import twilio_service

                    try:
                        async for raw in el_ws:
                            data = json.loads(raw)
                            msg_type = data.get("type")

                            if msg_type == "audio":
                                audio_b64 = data["audio_event"]["audio_base_64"]
                                if stream_sid["value"]:
                                    await twilio_ws.send_text(json.dumps({
                                        "event": "media",
                                        "streamSid": stream_sid["value"],
                                        "media": {"payload": audio_b64},
                                    }))

                            elif msg_type == "ping":
                                await el_ws.send(json.dumps({
                                    "type": "pong",
                                    "event_id": data["ping_event"]["event_id"],
                                }))

                            elif msg_type == "agent_response":
                                text = data.get("agent_response_event", {}).get("agent_response", "")
                                if text:
                                    await _append_transcript(call_log, db, "Agent", text)

                            elif msg_type == "user_transcript":
                                text = data.get("user_transcription_event", {}).get("user_transcript", "")
                                if text:
                                    await _append_transcript(call_log, db, "Insurance Rep", text)

                            elif msg_type == "interruption":
                                # Clear Twilio audio buffer so agent can be interrupted
                                if stream_sid["value"]:
                                    await twilio_ws.send_text(json.dumps({
                                        "event": "clear",
                                        "streamSid": stream_sid["value"],
                                    }))

                            elif msg_type == "client_tool_call":
                                await _handle_tool_call(data, el_ws, call_log, call_sid, settings, twilio_service)

                    except Exception as e:
                        logger.error(f"el_to_twilio error: {e}")

                await asyncio.gather(twilio_to_el(), el_to_twilio())

        except Exception as e:
            logger.error(f"ElevenLabs bridge error for call {call_log.id}: {e}")


async def _handle_tool_call(data: dict, el_ws, call_log: CallLog, call_sid: dict, settings, twilio_service):
    """Dispatch ElevenLabs client_tool_call events to the appropriate Twilio action."""
    tool_name = data.get("tool_name")
    tool_call_id = data.get("tool_call_id")
    params = data.get("parameters", {})

    if tool_name == "send_dtmf":
        digit = params.get("digit", "")
        result_msg = f"Sent DTMF digit: {digit}"
        if call_sid["value"] and digit:
            try:
                await asyncio.to_thread(twilio_service.send_dtmf, call_sid["value"], digit)
                logger.info(f"DTMF '{digit}' sent for call {call_log.id}")
            except Exception as e:
                logger.error(f"Failed to send DTMF for call {call_log.id}: {e}")
                result_msg = f"Failed to send DTMF: {e}"
        else:
            result_msg = "DTMF skipped: missing call SID or digit"
            logger.warning(f"DTMF skipped for call {call_log.id}: call_sid={call_sid['value']!r}, digit={digit!r}")

        await el_ws.send(json.dumps({
            "type": "client_tool_result",
            "tool_call_id": tool_call_id,
            "result": result_msg,
        }))

    elif tool_name == "transfer_call":
        reason = params.get("reason", "")
        office_number = settings.office_transfer_number
        result_msg = f"Transfer initiated: {reason}"

        if call_sid["value"] and office_number:
            try:
                await asyncio.to_thread(twilio_service.transfer_call, call_sid["value"], office_number)
                await manager.broadcast("call:transfer_initiated", {
                    "call_log_id": str(call_log.id),
                    "reason": reason,
                })
                logger.info(f"Call {call_log.id} transferred to {office_number}: {reason}")
            except Exception as e:
                logger.error(f"Transfer failed for call {call_log.id}: {e}")
                result_msg = f"Transfer failed: {e}"
        else:
            missing = []
            if not call_sid["value"]:
                missing.append("call SID")
            if not office_number:
                missing.append("OFFICE_TRANSFER_NUMBER config")
            result_msg = f"Transfer skipped: missing {', '.join(missing)}"
            logger.warning(f"Transfer skipped for call {call_log.id}: {result_msg}")

        await el_ws.send(json.dumps({
            "type": "client_tool_result",
            "tool_call_id": tool_call_id,
            "result": result_msg,
        }))

    else:
        logger.warning(f"Unknown tool call '{tool_name}' for call {call_log.id}")
        await el_ws.send(json.dumps({
            "type": "client_tool_result",
            "tool_call_id": tool_call_id,
            "result": f"Unknown tool: {tool_name}",
        }))


elevenlabs_bridge = ElevenLabsBridge()
