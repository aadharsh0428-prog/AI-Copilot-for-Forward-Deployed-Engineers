"""
Spec generator service.
Generates full implementation spec: tickets, API plan, rollout timeline.
Uses Ollama for content generation.
"""
import os
import json
import httpx
from models.schemas import WorkflowExtractionResponse

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

SPEC_SYSTEM = """You are a technical product manager at Dataleap building enterprise AI agents.
Generate a complete implementation specification.

You MUST respond ONLY with valid JSON. No markdown, no explanation.

Return this exact JSON:
{
  "spec_title": "Project title",
  "executive_summary": "2-3 sentence summary for the customer",
  "tickets": [
    {
      "id": "DL-001",
      "title": "Ticket title",
      "type": "feature | integration | infra | testing",
      "priority": "P0 | P1 | P2 | P3",
      "estimate_days": 1,
      "description": "What needs to be built",
      "acceptance_criteria": ["criteria 1", "criteria 2"],
      "dependencies": []
    }
  ],
  "rollout_phases": [
    {
      "phase": 1,
      "name": "Phase name",
      "duration_days": 3,
      "goals": ["goal 1"],
      "deliverables": ["deliverable 1"]
    }
  ],
  "success_metrics": [
    {
      "metric": "Metric name",
      "baseline": "Current state",
      "target": "Goal state",
      "measurement": "How to measure"
    }
  ],
  "risks": [
    {
      "risk": "Risk description",
      "likelihood": "low | medium | high",
      "mitigation": "How to mitigate"
    }
  ],
  "total_estimate_days": 10,
  "recommended_first_step": "What to build first (MVP)"
}
"""


async def generate_spec(workflow: WorkflowExtractionResponse, agent_design: dict) -> dict:
    """Generate full implementation spec."""
    user_prompt = f"""Generate a complete implementation specification for:

WORKFLOW:
{json.dumps(workflow.model_dump(), indent=2)}

AGENT DESIGN:
{json.dumps(agent_design, indent=2)}

Create realistic engineering tickets, phased rollout, and success metrics.
Output ONLY valid JSON."""

    result = await _call_ollama(user_prompt)
    if result is None and OPENAI_API_KEY:
        result = await _call_openai(user_prompt)
    if result is None:
        result = _default_spec(workflow)

    return result


async def _call_ollama(user_prompt: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": f"{SPEC_SYSTEM}\n\nUser: {user_prompt}\n\nAssistant:",
                    "stream": False,
                    "options": {"temperature": 0.2},
                },
            )
            if response.status_code == 200:
                data = response.json()
                return _safe_json_parse(data.get("response", ""))
    except Exception as e:
        print(f"Ollama spec error: {e}")
    return None


async def _call_openai(user_prompt: str) -> dict | None:
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SPEC_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        return _safe_json_parse(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI spec error: {e}")
    return None


def _safe_json_parse(text: str) -> dict | None:
    if not text:
        return None
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return None


def _default_spec(workflow: WorkflowExtractionResponse) -> dict:
    return {
        "spec_title": f"{workflow.customer_team or 'Workflow'} Automation — Implementation Spec",
        "executive_summary": f"Automate the {workflow.summary}. Expected automation score: {workflow.automation_score}/10.",
        "tickets": [
            {
                "id": "DL-001",
                "title": "Set up Ollama for full spec generation",
                "type": "infra",
                "priority": "P0",
                "estimate_days": 0.5,
                "description": "Run: ollama pull llama3.1 to enable full AI-powered spec generation",
                "acceptance_criteria": ["ollama serve running", "model responds to /api/generate"],
                "dependencies": [],
            }
        ],
        "rollout_phases": [
            {
                "phase": 1,
                "name": "Setup & Discovery",
                "duration_days": 2,
                "goals": ["Configure environment"],
                "deliverables": ["Working pipeline"],
            }
        ],
        "success_metrics": [
            {
                "metric": "Manual work reduction",
                "baseline": "100% manual",
                "target": "< 10% manual",
                "measurement": "Time tracking",
            }
        ],
        "risks": [
            {
                "risk": "API integration complexity",
                "likelihood": "medium",
                "mitigation": "Start with webhook-based integrations",
            }
        ],
        "total_estimate_days": 5,
        "recommended_first_step": "Configure Ollama locally, then re-run spec generation for full output.",
    }
