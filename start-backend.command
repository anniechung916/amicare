#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
venv/bin/pip install "pydantic[email]" -q
venv/bin/uvicorn app.main:app --reload --port 8000
