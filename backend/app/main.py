import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.routers import tickets, calls, estimates, uploads, websocket, carriers, auth, claims
from app.routers.auth import decode_token
from app.services.carrier_seed import seed_carriers

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
    "/",
)


class JWTMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # WebSocket upgrade — auth handled in websocket router via query param
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Exempt paths
        if any(path.startswith(p) for p in _AUTH_EXEMPT_PREFIXES) and path != "/api/":
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs("./audio_cache", exist_ok=True)
    async with AsyncSessionLocal() as db:
        await seed_carriers(db)
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
