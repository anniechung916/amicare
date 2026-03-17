from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    id: UUID
    ticket_id: UUID
    file_type: str
    original_filename: str
    mime_type: Optional[str]
    file_size_bytes: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}
