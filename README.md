# 🤖 Dataleap Field Agent — Workshop-to-Agent Builder

> **In-person AI copilot for Forward Deployed Engineers.**  
> Converts live German customer discussions into structured AI workflow specifications and deployable agent plans.

---

## What It Does

During on-site DACH customer workshops, this tool helps you:

1. **Record** live German meeting audio (Whisper transcription)
2. **Extract** structured workflows: triggers, actions, tools, stakeholders, edge cases
3. **Design** AI agent architecture using Ollama (local LLM, free)
4. **Generate** full implementation specs: tickets, rollout phases, success metrics
5. **Export** as JSON to share with the team

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│   Voice Input → Text → Workflow → Agent → Spec          │
│   Port: 3000                                            │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│   /transcribe → /analyze-text → /design-agent           │
│   /generate-spec → /ws/live                             │
│   Port: 8000                                            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────┐        ┌────────▼────────┐
│    Ollama    │        │  Whisper API    │
│  llama3.1   │        │ (OpenAI or CLI) │
│  Port: 11434 │        │ German audio    │
└──────────────┘        └─────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) (free, local LLM)
- ffmpeg (for local Whisper)

---

### 1. Install Ollama + Pull Model

```bash
ollama pull llama3.1

# Start Ollama if not auto-started:
ollama serve
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate — choose your OS:
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows (PowerShell)

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set OPENAI_API_KEY for Whisper API transcription
# Otherwise local Whisper CLI is used (pip install openai-whisper)

# Start backend
uvicorn main:app --reload --port 8000
```

Backend → http://localhost:8000  
API docs → http://localhost:8000/docs

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend → http://localhost:3000

---

### 4. Optional: Local Whisper (offline transcription)

```bash
pip install openai-whisper

# macOS
brew install ffmpeg

# Windows (PowerShell) — apt does NOT work on Windows
winget install ffmpeg

# Ubuntu / Debian
apt install ffmpeg
```

> After installing ffmpeg, close and reopen your terminal so the PATH updates, then verify: `ffmpeg -version`

---

## Whisper Configuration

| Option | Setup | Cost |
|--------|-------|------|
| **OpenAI Whisper API** | Set `OPENAI_API_KEY` in `.env` | ~$0.006/min |
| **Local Whisper CLI** | `pip install openai-whisper` + ffmpeg | Free, slower |
| **Stub mode** | No setup needed | Free, returns sample text |

---

## LLM Configuration

| Option | Setup | Cost |
|--------|-------|------|
| **Ollama llama3.1** | `ollama pull llama3.1` | Free, local |
| **Ollama mistral** | `ollama pull mistral` | Free, faster |
| **OpenAI GPT-4o-mini** | Set `OPENAI_API_KEY` | ~$0.01/run |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/transcribe` | POST | Audio file → German transcript |
| `/analyze-text` | POST | Text → Structured workflow |
| `/extract-workflow` | POST | Transcript → Workflow |
| `/design-agent` | POST | Workflow → Agent architecture |
| `/generate-spec` | POST | Workflow + Agent → Full spec |
| `/ws/live` | WebSocket | Real-time streaming pipeline |

---

## Usage in the Field

1. Open http://localhost:3000 on your laptop
2. Join customer workshop
3. Click **RECORD** — streams to Whisper live
4. Click **STOP** when done
5. Click **ANALYSE WORKFLOW**
6. Get structured spec in ~30 seconds
7. **Export JSON** or share screen with the customer

---

## Prompt Engineering — What Was Improved

The core extraction prompt in `backend/services/workflow_extractor.py` went through several iterations during testing with real DACH customer workshop transcripts. Here's what was fixed and why:

### Fix 1 — Action Decomposition
**Problem:** Multiple distinct checks were being collapsed into a single step, e.g. *"Review expense for correctness and compliance"* instead of separate steps for amount, invoice, and guidelines.

**Fix:** Added an explicit decomposition rule with a BAD vs GOOD example. Any action containing "and", "or", "und", "sowie", "bzw." is always forced into two separate steps — no exceptions.

### Fix 2 — German Domain Vocabulary
**Problem:** "Ausgabe" was being translated as "output" (correct literal translation) instead of "expense" (correct in a Finance/Ramp context).

**Fix:** Added a ~50-term vocabulary table covering 5 categories — Finance, Approvals, Workflow, People, and Systems — with explicit disambiguation rules for ambiguous terms like Ausgabe, Protokoll, Abnahme, and Meldung.

### Fix 3 — Automation Score Direction
**Problem:** `automation_score` was rating the current automation level of the workflow, not its automation potential. A fully manual workflow that is trivially automatable was scoring 2/10.

**Fix:** Rewrded the rule to explicitly say *"rate AUTOMATION POTENTIAL, not current automation level"* with examples of what scores high vs low.

### Fix 4 — Full Translation Coverage
**Problem:** Nested fields like `stakeholders`, `edge_cases.scenario`, and `edge_cases.handling` were being left in German even when the top-level fields were translated.

**Fix:** Replaced the generic "translate German content" instruction with an explicit field-by-field list: summary, pain_points, actions, stakeholders, edge_cases.scenario, edge_cases.handling, automation_rationale, and notes.

---

## Project Structure

```
dataleap-field-agent/
├── backend/
│   ├── main.py                    # FastAPI app + all routes
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   │   └── schemas.py             # Pydantic data models
│   └── services/
│       ├── transcription.py       # Whisper (API + local)
│       ├── workflow_extractor.py  # Ollama workflow extraction ← main prompt file
│       ├── agent_designer.py      # Ollama agent design
│       └── spec_generator.py      # Ollama spec generation
├── frontend/
│   ├── package.json
│   ├── public/index.html
│   └── src/
│       ├── App.js
│       ├── index.js
│       ├── index.css              # Design system + CSS vars
│       ├── utils/api.js           # API client
│       ├── hooks/
│       │   └── useVoiceRecorder.js
│       ├── components/
│       │   ├── Header.js
│       │   ├── VoiceInput.js
│       │   ├── WorkflowResult.js
│       │   ├── AgentDesign.js
│       │   └── SpecDisplay.js
│       └── pages/
│           ├── WorkshopPage.js
│           └── SpecPage.js
└── README.md
```

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + React Router | Fast, mobile-friendly |
| Styling | CSS-in-JS (inline) | Zero dependencies, portable |
| Voice | MediaRecorder API + Whisper | Browser-native recording |
| Backend | FastAPI + Uvicorn | Fast async Python |
| LLM | Ollama (llama3.1) | Free, local, no API key needed |
| Transcription | OpenAI Whisper | Best German accuracy |
| Data models | Pydantic v2 | Type-safe structured output |

---

## The Pitch

> "Since the role requires heavy on-site customer work across DACH,  
> I didn't want German to be a limitation.  
> I wanted to solve it like an engineer.
>
> So I built a small POC:  
> an in-person workshop copilot that converts live German customer discussions  
> into structured AI workflow specifications and deployable agent plans.
>
> The goal is not translation — it is faster workflow discovery and faster shipping."