import logging

from cryptography.fernet import Fernet
from sqlalchemy import String, TypeDecorator

from app.config import get_settings

logger = logging.getLogger("amicare.encryption")

_fernet = None
_warned = False


def _get_fernet():
    global _fernet, _warned
    if _fernet is None:
        key = get_settings().fernet_key
        if key:
            _fernet = Fernet(key.encode() if isinstance(key, str) else key)
        elif not _warned:
            logger.error(
                "FERNET_KEY is not set — patient PII (phone numbers, policy numbers) "
                "will be stored UNENCRYPTED. Set FERNET_KEY in .env before handling real patient data."
            )
            _warned = True
    return _fernet


class EncryptedString(TypeDecorator):
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        f = _get_fernet()
        if f is None:
            return value  # stores plaintext — FERNET_KEY warning already logged
        return f.encrypt(value.encode()).decode()

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        f = _get_fernet()
        if f is None:
            return value
        try:
            return f.decrypt(value.encode()).decode()
        except Exception:
            # Value may be plaintext from before encryption was enabled
            return value


def generate_fernet_key() -> str:
    return Fernet.generate_key().decode()
