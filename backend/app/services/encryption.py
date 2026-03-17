from cryptography.fernet import Fernet
from sqlalchemy import String, TypeDecorator

from app.config import get_settings

_fernet = None


def _get_fernet():
    global _fernet
    if _fernet is None:
        key = get_settings().fernet_key
        if key:
            _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


class EncryptedString(TypeDecorator):
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        f = _get_fernet()
        if f is None:
            return value
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
            return value


def generate_fernet_key() -> str:
    return Fernet.generate_key().decode()
