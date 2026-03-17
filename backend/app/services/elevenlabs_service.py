import os
import hashlib

import httpx

from app.config import get_settings

AUDIO_CACHE_DIR = "./audio_cache"


class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.elevenlabs_api_key
        self.voice_id = settings.elevenlabs_voice_id

    async def text_to_speech(self, text: str) -> bytes:
        if not self.api_key or not self.voice_id:
            raise RuntimeError("ElevenLabs credentials not configured")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{self.voice_id}",
                headers={"xi-api-key": self.api_key, "Content-Type": "application/json"},
                json={
                    "text": text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {"stability": 0.6, "similarity_boost": 0.75},
                },
                timeout=30.0,
            )
            response.raise_for_status()
            return response.content

    async def generate_and_cache(self, text: str, cache_key: str) -> str:
        os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)
        filename = f"{cache_key}.mp3"
        filepath = os.path.join(AUDIO_CACHE_DIR, filename)

        if not os.path.exists(filepath):
            audio_bytes = await self.text_to_speech(text)
            with open(filepath, "wb") as f:
                f.write(audio_bytes)

        settings = get_settings()
        return f"{settings.twilio_webhook_base_url}/audio/{filename}"


elevenlabs_service = ElevenLabsService()
