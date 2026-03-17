from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://amicare:amicare_dev@localhost:5432/amicare"

    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_webhook_base_url: str = "http://localhost:8000"

    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    elevenlabs_agent_id: str = ""
    elevenlabs_phone_number_id: str = ""

    fernet_key: str = ""

    backend_cors_origins: str = "http://localhost:5173"
    upload_dir: str = "./uploads"

    # Test mode: auto-hangup after a configurable duration to limit credit spend
    test_mode: bool = False
    test_mode_max_seconds: int = 120

    # Office phone number for warm transfers when insurance rep asks to speak to a human
    office_transfer_number: str = ""

    # JWT auth
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480  # 8 hours

    # Notifications
    resend_api_key: str = ""
    notification_from_email: str = "estimates@amicare.app"
    app_base_url: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
