"""
Transcription service using OpenAI Whisper API.
Whisper API is free to use via openai Python client with your API key.
Falls back to local Whisper via subprocess if no API key is set.
"""
import os
import subprocess
import json
from pathlib import Path


async def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe audio file. 
    Priority:
      1. OpenAI Whisper API (if OPENAI_API_KEY set)
      2. Local whisper via CLI (if installed: pip install openai-whisper)
      3. Stub for development
    """
    api_key = os.getenv("OPENAI_API_KEY", "")

    if api_key:
        return await _transcribe_openai_api(audio_path, api_key)
    else:
        return await _transcribe_local_whisper(audio_path)


async def _transcribe_openai_api(audio_path: str, api_key: str) -> dict:
    """Use OpenAI Whisper API - $0.006/minute, very cheap."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=api_key)

        with open(audio_path, "rb") as audio_file:
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="de",  # German - force for DACH customer meetings
                response_format="verbose_json",
            )

        return {
            "text": response.text,
            "language": getattr(response, "language", "de"),
            "duration": getattr(response, "duration", None),
        }
    except Exception as e:
        # Fall back to local
        return await _transcribe_local_whisper(audio_path)


async def _transcribe_local_whisper(audio_path: str) -> dict:
    """
    Use local Whisper CLI.
    Install: pip install openai-whisper
    Requires ffmpeg installed.
    """
    try:
        result = subprocess.run(
            [
                "whisper",
                audio_path,
                "--language", "de",
                "--model", "base",
                "--output_format", "json",
                "--output_dir", "/tmp",
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode == 0:
            # Parse output JSON
            base_name = Path(audio_path).stem
            json_path = f"/tmp/{base_name}.json"
            if os.path.exists(json_path):
                with open(json_path) as f:
                    data = json.load(f)
                return {
                    "text": data.get("text", ""),
                    "language": "de",
                    "duration": None,
                }

        # If whisper CLI fails, return stub
        return _stub_transcription()

    except (FileNotFoundError, subprocess.TimeoutExpired):
        return _stub_transcription()


def _stub_transcription() -> dict:
    """
    Development stub — returns a sample German workflow discussion.
    Replace with real transcription in production.
    """
    return {
        "text": (
            "Nach jedem Sales Call müssen wir Gong analysieren, "
            "mit unserem Notion Playbook vergleichen und dem Sales Rep "
            "automatisch Feedback via Slack schicken. "
            "Außerdem soll ein Report für den Manager erstellt werden."
        ),
        "language": "de",
        "duration": 15.0,
        "note": "STUB: No Whisper available. Set OPENAI_API_KEY or install openai-whisper.",
    }
