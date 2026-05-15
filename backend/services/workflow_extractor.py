"""
Workflow extraction service.
Uses Ollama (local LLM) to extract structured workflow from German meeting text.
Primary model: llama3.1 or mistral (both free, run locally via Ollama).
Falls back to OpenAI if Ollama unavailable.
"""
import os
import json
import httpx
from models.schemas import (
    WorkflowExtractionResponse,
    WorkflowTrigger,
    WorkflowAction,
    IntegrationPoint,
    EdgeCase,
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SYSTEM_PROMPT = """You are an expert Forward Deployed AI Engineer at Dataleap.
Your job is to analyze messy enterprise customer discussions (often in German) and extract 
structured workflow information to design AI automation agents.

You MUST respond ONLY with valid JSON. No markdown, no explanation, just JSON.

Extract and return this exact JSON structure:
{
  "summary": "Brief English summary of what the team does",
  "language_detected": "de",
  "customer_team": "Which team/department this is (e.g. Sales, Finance, Operations)",
  "pain_points": ["list", "of", "pain points"],
  "trigger": {
    "event": "What triggers this workflow",
    "frequency": "How often (daily/per-event/weekly/etc)",
    "source_system": "System that fires the trigger"
  },
  "actions": [
    {
      "step": 1,
      "action": "What happens",
      "actor": "human or system name",
      "tool": "Tool used if any",
      "manual": true
    }
  ],
  "stakeholders": ["Role 1", "Role 2"],
  "integration_points": [
    {
      "tool": "Tool name",
      "type": "input or output or both",
      "api_available": true,
      "notes": "Optional note"
    }
  ],
  "edge_cases": [
    {
      "scenario": "What could go wrong",
      "handling": "How to handle it"
    }
  ],
  "automation_score": 8,
  "automation_rationale": "Why this is a good/bad automation candidate",
  "priority": "high"
}

Rules:
- Always output valid JSON only
- Translate ALL German content to English in your output — this applies to every field
  without exception: summary, pain_points, actions, stakeholders, edge_cases.scenario,
  edge_cases.handling, automation_rationale, and notes. No German text should appear
  anywhere in the output JSON.
- automation_score: 0-10 — rate AUTOMATION POTENTIAL, not current automation level.
  A fully manual workflow that is easy to automate scores HIGH (8-10).
  A workflow with complex human judgment or compliance constraints scores LOW (1-4).
  Do NOT score how automated it already is — score how automatable it could be.
- priority: low | medium | high | critical
- Be specific about tools (Slack, Notion, HubSpot, Gong, SAP, etc)
- Identify ALL manual steps that could be automated

IMPORTANT — Action decomposition:
- Every distinct check, decision, or hand-off in the workflow MUST be its own action step.
- Never collapse multiple checks into one step. For example:
    BAD  → step 1: "Review expense for correctness and compliance"
    GOOD → step 1: "Check expense amount is correct"
           step 2: "Verify invoice is complete and attached"
           step 3: "Confirm expense matches internal guidelines"
           step 4: "Approve expense and push to internal reporting"
- The final approval / downstream write-back step must always be included as its own action.
- If an action description contains "and", "or", "sowie", "und", "bzw." — it is ALWAYS two steps. Split it. No exceptions.

IMPORTANT — German domain vocabulary:
Always translate using business context, not literal meaning. Key ambiguous terms:

  FINANCE & EXPENSES
  - Ausgabe / Ausgaben         → expense / expenses  (NOT "output" — only means output in tech contexts)
  - Spesen                     → expense reimbursement
  - Rechnung                   → invoice
  - Rechnungsprüfung           → invoice verification
  - Buchung / buchen           → booking / to book (accounting entry)
  - Überweisung                → bank transfer
  - Kostenstelle               → cost center
  - Budget / Budgetfreigabe    → budget / budget approval
  - Abrechnung                 → settlement / billing / expense report
  - Mahnung                    → payment reminder / dunning notice
  - Gutschrift                 → credit note
  - Steuern / Steuer           → taxes / tax
  - MwSt / Mehrwertsteuer      → VAT
  - Zahlung / Zahlungseingang  → payment / incoming payment

  APPROVALS & PROCESS
  - Freigabe / freigeben       → approval / to approve
  - Genehmigung / genehmigen   → approval / authorization / to authorize
  - Prüfung / prüfen           → review / check / to review
  - Kontrolle / kontrollieren  → control / verification / to verify
  - Abnahme                    → sign-off / acceptance
  - Ablehnung / ablehnen       → rejection / to reject
  - Eskalation / eskalieren    → escalation / to escalate
  - Weiterleiten               → to forward / hand off
  - Zuständig / Zuständigkeit  → responsible / ownership
  - Vier-Augen-Prinzip         → four-eyes principle (dual approval)

  WORKFLOW & OPERATIONS
  - Prozess / Ablauf           → process / workflow
  - Schritt / Schritte         → step / steps
  - Auslöser                   → trigger
  - Benachrichtigung           → notification
  - Erinnerung                 → reminder
  - Meldung                    → alert / notification / message
  - Bericht / Reporting        → report / reporting
  - Auswertung                 → analysis / evaluation
  - Zusammenfassung            → summary
  - Protokoll                  → log / minutes (meeting) / record
  - Onboarding                 → onboarding (keep as-is)
  - Stammdaten                 → master data
  - Datenpflege                → data maintenance
  - Rückfrage                  → follow-up question / clarification request

  PEOPLE & TEAMS
  - Mitarbeiter                → employee
  - Vorgesetzter / Vorgesetzte → manager / supervisor
  - Abteilung                  → department
  - Vertrieb                   → sales
  - Einkauf                    → procurement / purchasing
  - Buchhaltung                → accounting
  - Controlling                → finance controlling (keep as-is)
  - Geschäftsführung           → management / executive team
  - Kunde / Kunden             → customer / customers

  SYSTEMS & TECH
  - Schnittstelle              → interface / API / integration
  - Anbindung                  → integration / connection
  - Datenbank                  → database
  - Auftrag / Aufträge         → order / orders (sales or work orders)
  - Ticket / Tickets           → ticket / tickets (keep as-is)
  - Anhang                     → attachment
  - Vorlage                    → template

Disambiguation rule: always use the department/system context to pick the correct translation.
When the surrounding context is Finance, HR, or Operations — prefer the business-domain term over
the generic/literal translation. If genuinely ambiguous, include both in a note field.
"""


async def extract_workflow(text: str, context: str = "") -> WorkflowExtractionResponse:
    """
    Main entry point: extract structured workflow from German meeting text.
    Tries Ollama first, falls back to OpenAI.
    """
    user_prompt = f"""Analyze this enterprise customer discussion and extract the workflow:

MEETING CONTEXT: {context or 'DACH enterprise customer workshop'}

DISCUSSION:
{text}

Remember: Output ONLY valid JSON, nothing else."""

    # Try Ollama first (free, local)
    result = await _call_ollama(user_prompt)
    if result is None and OPENAI_API_KEY:
        result = await _call_openai(user_prompt)

    if result is None:
        # Return a sensible default if both fail
        result = _default_extraction(text)

    return _parse_response(result)


async def _call_ollama(user_prompt: str) -> dict | None:
    """Call Ollama local LLM."""
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": f"{SYSTEM_PROMPT}\n\nUser: {user_prompt}\n\nAssistant:",
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9,
                    },
                },
            )
            if response.status_code == 200:
                data = response.json()
                raw_text = data.get("response", "")
                return _safe_json_parse(raw_text)
    except Exception as e:
        print(f"Ollama error: {e}")
    return None


async def _call_openai(user_prompt: str) -> dict | None:
    """Fallback to OpenAI GPT-4o-mini (cheap)."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        return _safe_json_parse(raw)
    except Exception as e:
        print(f"OpenAI error: {e}")
    return None


def _safe_json_parse(text: str) -> dict | None:
    """Extract JSON from LLM response, handling markdown fences."""
    if not text:
        return None
    # Strip markdown fences
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    # Find first { ... }
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


def _default_extraction(text: str) -> dict:
    """Fallback extraction when LLMs are unavailable."""
    return {
        "summary": "Workflow extracted from customer discussion (LLM unavailable - configure Ollama or OpenAI)",
        "language_detected": "de",
        "customer_team": "Unknown",
        "pain_points": ["Manual process identified in discussion"],
        "trigger": {
            "event": "Manually triggered",
            "frequency": "Unknown",
            "source_system": "Unknown",
        },
        "actions": [
            {
                "step": 1,
                "action": "Review discussion text manually",
                "actor": "human",
                "tool": None,
                "manual": True,
            }
        ],
        "stakeholders": ["Team member"],
        "integration_points": [],
        "edge_cases": [],
        "automation_score": 5,
        "automation_rationale": "Unable to assess without LLM. Configure Ollama (ollama pull llama3.1) or set OPENAI_API_KEY.",
        "priority": "medium",
    }


def _parse_response(data: dict) -> WorkflowExtractionResponse:
    """Parse raw dict into typed response model."""
    trigger_data = data.get("trigger")
    trigger = WorkflowTrigger(**trigger_data) if trigger_data else None

    actions = [WorkflowAction(**a) for a in data.get("actions", [])]

    integrations = [IntegrationPoint(**i) for i in data.get("integration_points", [])]

    edge_cases = [EdgeCase(**e) for e in data.get("edge_cases", [])]

    return WorkflowExtractionResponse(
        summary=data.get("summary", ""),
        language_detected=data.get("language_detected", "de"),
        customer_team=data.get("customer_team"),
        pain_points=data.get("pain_points", []),
        trigger=trigger,
        actions=actions,
        stakeholders=data.get("stakeholders", []),
        integration_points=integrations,
        edge_cases=edge_cases,
        automation_score=int(data.get("automation_score", 5)),
        automation_rationale=data.get("automation_rationale", ""),
        priority=data.get("priority", "medium"),
    )