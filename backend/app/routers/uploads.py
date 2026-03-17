import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.ticket import Ticket
from app.models.file_upload import FileUpload
from app.schemas.file_upload import FileUploadResponse

router = APIRouter()


@router.post(
    "/tickets/{ticket_id}/uploads", response_model=FileUploadResponse, status_code=201
)
async def upload_file(
    ticket_id: uuid.UUID,
    file: UploadFile = File(...),
    file_type: str = Form("other"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ticket not found")

    settings = get_settings()
    upload_dir = os.path.join(settings.upload_dir, str(ticket_id))
    os.makedirs(upload_dir, exist_ok=True)

    file_id = uuid.uuid4()
    ext = os.path.splitext(file.filename or "")[1]
    stored_name = f"{file_id}{ext}"
    stored_path = os.path.join(upload_dir, stored_name)

    content = await file.read()
    with open(stored_path, "wb") as f:
        f.write(content)

    upload = FileUpload(
        id=file_id,
        ticket_id=ticket_id,
        file_type=file_type,
        original_filename=file.filename or "unknown",
        stored_path=stored_path,
        mime_type=file.content_type,
        file_size_bytes=len(content),
    )
    db.add(upload)
    await db.flush()
    await db.refresh(upload)
    return upload


@router.get("/uploads/{upload_id}/download")
async def download_file(upload_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FileUpload).where(FileUpload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(upload.stored_path):
        raise HTTPException(status_code=404, detail="File missing from storage")
    return FileResponse(
        upload.stored_path,
        filename=upload.original_filename,
        media_type=upload.mime_type,
    )
