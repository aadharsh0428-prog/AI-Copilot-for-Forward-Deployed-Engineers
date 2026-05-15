from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio
import json
import tempfile
import os
from pathlib import Path

from services.transcription import transcribe_audio
from services.workflow_extractor import extract_workflow
from services.agent_designer import design_agent
from services.spec_generator import generate_spec
from models.schemas import (
    WorkflowExtractionRequest,
    WorkflowExtractionResponse,
    AgentDesignRequest,
    SpecGenerationRequest,
    TextAnalysisRequest,
)

app = FastAPI(
    title="Dataleap Field Agent — Workshop Copilot",
    description="In-person AI copilot for Forward Deployed Engineers. Converts live German customer discussions into structured AI workflow specifications.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "service": "Dataleap Workshop Copilot",
        "status": "running",
        "endpoints": [
            "/transcribe",
            "/extract-workflow",
            "/design-agent",
            "/generate-spec",
            "/analyze-text",
            "/ws/live",
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    Accepts audio file (wav/mp3/webm/ogg), returns German transcription via Whisper.
    Uses OpenAI Whisper API (free tier available).
    """
    try:
        suffix = Path(file.filename).suffix if file.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        result = await transcribe_audio(tmp_path)
        os.unlink(tmp_path)

        return {
            "transcript": result["text"],
            "language": result.get("language", "de"),
            "duration": result.get("duration"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-text", response_model=WorkflowExtractionResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Accepts raw German (or any language) text, returns structured workflow extraction.
    Primary entry point for typed/pasted meeting notes.
    """
    result = await extract_workflow(request.text, request.context)
    return result


@app.post("/extract-workflow", response_model=WorkflowExtractionResponse)
async def extract_workflow_endpoint(request: WorkflowExtractionRequest):
    """
    Full workflow extraction from transcript — triggers, actions, tools, stakeholders.
    """
    result = await extract_workflow(request.transcript, request.context)
    return result


@app.post("/design-agent")
async def design_agent_endpoint(request: AgentDesignRequest):
    """
    Given extracted workflow, design the AI agent architecture.
    Uses Ollama locally for this reasoning step.
    """
    result = await design_agent(request.workflow)
    return result


@app.post("/generate-spec")
async def generate_spec_endpoint(request: SpecGenerationRequest):
    """
    Generate full implementation spec: tickets, API plan, integration map, rollout.
    """
    result = await generate_spec(request.workflow, request.agent_design)
    return result


@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    """
    WebSocket endpoint for live streaming updates.
    Client sends audio chunks or text, server streams back structured analysis.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)

            if payload.get("type") == "text":
                text = payload.get("text", "")
                context = payload.get("context", "")

                await websocket.send_text(
                    json.dumps({"type": "status", "message": "Analyzing workflow..."})
                )

                result = await extract_workflow(text, context)

                await websocket.send_text(
                    json.dumps(
                        {
                            "type": "workflow_extracted",
                            "data": result.model_dump(),
                        }
                    )
                )

                await websocket.send_text(
                    json.dumps({"type": "status", "message": "Designing agent..."})
                )

                agent = await design_agent(result)
                await websocket.send_text(
                    json.dumps({"type": "agent_designed", "data": agent})
                )

                await websocket.send_text(
                    json.dumps(
                        {"type": "status", "message": "Generating full spec..."}
                    )
                )

                spec = await generate_spec(result, agent)
                await websocket.send_text(
                    json.dumps({"type": "spec_ready", "data": spec})
                )

                await websocket.send_text(json.dumps({"type": "complete"}))

            elif payload.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": str(e)})
            )
        except Exception:
            pass


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
