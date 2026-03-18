import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.routers import tickets, calls, estimates, uploads, websocket, carriers, auth, claims
from app.routers.auth import decode_token
from app.services.carrier_seed import seed_carriers

logger = logging.getLogger("amicare.startup")

# Paths that bypass JWT auth
# Twilio webhooks must be unauthenticated (called by Twilio's servers)
_AUTH_EXEMPT_PREFIXES = (
    "/api/auth/",
    "/api/health",
    "/api/calls/twiml/",
    "/api/calls/status/",
    "/api/calls/recording/",
    "/api/estimates/public/",
    "/api/claims/",
    "/ws",
    "/audio/",
)

# Exact paths that bypass auth (root for health/favicon in production)
_AUTH_EXEMPT_EXACT = {"/", "/favicon.ico"}


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # WebSocket upgrade — auth handled in websocket router via query param
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Exempt paths
        if path in _AUTH_EXEMPT_EXACT or any(path.startswith(p) for p in _AUTH_EXEMPT_PREFIXES):
            return await call_next(request)

        # Require Bearer token for all other /api/* routes
        if path.startswith("/api/"):
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                return JSONResponse({"detail": "Not authenticated"}, status_code=401)

            user_id = decode_token(auth_header.split(" ", 1)[1])
            if not user_id:
                return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)

            request.state.current_user_id = user_id

        return await call_next(request)


async def _reconcile_stale_calls():
    """On startup, mark any calls still 'active' in DB that ElevenLabs considers done."""
    from app.models.call_log import CallLog, CallStatus
    from app.services.elevenlabs_call_service import elevenlabs_call_service

    active_statuses = [
        CallStatus.QUEUED, CallStatus.RINGING,
        CallStatus.IN_PROGRESS, CallStatus.ON_HOLD, CallStatus.TRANSFERRING,
    ]
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CallLog).where(CallLog.status.in_(active_statuses))
        )
        stale = result.scalars().all()

    if not stale:
        return

    logger.info(f"Reconciling {len(stale)} stale call(s) on startup")
    for call_log in stale:
        conversation_id = call_log.summary  # stored here by call_orchestrator
        if not conversation_id:
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(CallLog).where(CallLog.id == call_log.id))
                cl = result.scalar_one_or_none()
                if cl:
                    cl.status = CallStatus.COMPLETED
                    cl.call_outcome = "unknown"
                    cl.ended_at = cl.ended_at or datetime.utcnow()
                    await db.commit()
            continue
        try:
            data = await elevenlabs_call_service.get_conversation(conversation_id)
            el_status = data.get("status")
            if el_status == "done":
                async with AsyncSessionLocal() as db:
                    result = await db.execute(select(CallLog).where(CallLog.id == call_log.id))
                    cl = result.scalar_one_or_none()
                    if cl:
                        cl.status = CallStatus.COMPLETED
                        cl.call_outcome = "success"
                        cl.ended_at = cl.ended_at or datetime.utcnow()
                        secs = data.get("call_duration_secs") or data.get("metadata", {}).get("call_duration_secs")
                        if secs:
                            cl.duration_seconds = int(secs)
                        items = data.get("transcript", [])
                        if items:
                            lines = [
                                f"[{'Agent' if i.get('role') == 'agent' else 'Insurance Rep'}]: {(i.get('message') or '').strip()}"
                                for i in items if (i.get('message') or '').strip()
                            ]
                            cl.transcript = "\n".join(lines)
                        await db.commit()
                        logger.info(f"Reconciled stale call {call_log.id} → completed")
        except Exception as e:
            logger.warning(f"Could not reconcile call {call_log.id}: {e}")
            async with AsyncSessionLocal() as db:
                result = await db.execute(select(CallLog).where(CallLog.id == call_log.id))
                cl = result.scalar_one_or_none()
                if cl:
                    cl.status = CallStatus.COMPLETED
                    cl.call_outcome = "unknown"
                    cl.ended_at = cl.ended_at or datetime.utcnow()
                    await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs("./audio_cache", exist_ok=True)
    async with AsyncSessionLocal() as db:
        await seed_carriers(db)
    await _reconcile_stale_calls()
    yield


app = FastAPI(title="AmiCare API", version="0.1.0", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)

app.include_router(auth.router)
app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(calls.router, prefix="/api", tags=["calls"])
app.include_router(estimates.router, prefix="/api", tags=["estimates"])
app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(carriers.router, prefix="/api/carriers", tags=["carriers"])
app.include_router(claims.router)
app.include_router(websocket.router)

app.mount("/audio", StaticFiles(directory="audio_cache"), name="audio")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
