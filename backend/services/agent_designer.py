"""
Agent designer service.
Given extracted workflow, designs the AI agent architecture using Ollama.
"""
import os
import json
import httpx
from models.schemas import WorkflowExtractionResponse

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

AGENT_DESIGN_SYSTEM = """You are a senior AI systems architect at Dataleap.
Your job is to design production-ready AI agent architectures based on enterprise workflow requirements.

You MUST respond ONLY with valid JSON. No markdown, no explanation.

Design and return this exact JSON:
{
  "agent_name": "Descriptive agent name",
  "agent_type": "single-agent | multi-agent | pipeline",
  "architecture_summary": "One-paragraph description",
  "agents": [
    {
      "name": "Agent name",
      "role": "What this agent does",
      "model_recommendation": "Which LLM model to use (e.g. gpt-4o, claude-3-haiku, llama3.1)",
      "tools": ["tool1", "tool2"],
      "mcp_servers": ["mcp-server-name"],
      "inputs": ["what this agent receives"],
      "outputs": ["what this agent produces"]
    }
  ],
  "orchestration": {
    "pattern": "sequential | parallel | conditional | event-driven",
    "description": "How agents coordinate"
  },
  "mcp_servers_needed": ["list of MCP servers to connect"],
  "apis_needed": [
    {
      "service": "Service name",
      "endpoints": ["POST /endpoint"],
      "auth": "OAuth2 / API Key / etc"
    }
  ],
  "data_flow": "Describe the data flow step by step",
  "estimated_latency": "e.g. <5s end-to-end",
  "estimated_cost": "e.g. ~$0.02 per run",
  "complexity": "low | medium | high",
  "build_time_estimate": "e.g. 2-3 days"
}
"""


async def design_agent(workflow: WorkflowExtractionResponse) -> dict:
    """Design AI agent architecture for the given workflow."""
    workflow_dict = workflow.model_dump()

    user_prompt = f"""Design an AI agent architecture for this enterprise workflow:

{json.dumps(workflow_dict, indent=2)}

Focus on:
1. Dataleap's agentic AI approach
2. MCP server integrations for tool connectivity
3. Production-ready, fast, and cost-effective design
4. Clear agent responsibilities

Output ONLY valid JSON."""

    result = await _call_ollama(user_prompt)
    if result is None and OPENAI_API_KEY:
        result = await _call_openai(user_prompt)
    if result is None:
        result = _default_agent_design(workflow)

    return result


async def _call_ollama(user_prompt: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": f"{AGENT_DESIGN_SYSTEM}\n\nUser: {user_prompt}\n\nAssistant:",
                    "stream": False,
                    "options": {"temperature": 0.2},
                },
            )
            if response.status_code == 200:
                data = response.json()
                return _safe_json_parse(data.get("response", ""))
    except Exception as e:
        print(f"Ollama agent design error: {e}")
    return None


async def _call_openai(user_prompt: str) -> dict | None:
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": AGENT_DESIGN_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        return _safe_json_parse(response.choices[0].message.content)
    except Exception as e:
        print(f"OpenAI agent design error: {e}")
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


def _default_agent_design(workflow: WorkflowExtractionResponse) -> dict:
    tools = [i.tool for i in workflow.integration_points]
    return {
        "agent_name": f"{workflow.customer_team or 'Enterprise'} Automation Agent",
        "agent_type": "pipeline",
        "architecture_summary": "Configure Ollama (ollama pull llama3.1) for full agent design generation.",
        "agents": [
            {
                "name": "Orchestrator",
                "role": "Coordinates workflow execution",
                "model_recommendation": "llama3.1 or gpt-4o-mini",
                "tools": tools[:3] if tools else ["webhook"],
                "mcp_servers": [],
                "inputs": ["trigger event"],
                "outputs": ["completed workflow"],
            }
        ],
        "orchestration": {
            "pattern": "sequential",
            "description": "Steps execute in order",
        },
        "mcp_servers_needed": [],
        "apis_needed": [{"service": t, "endpoints": [], "auth": "API Key"} for t in tools],
        "data_flow": "Trigger → Process → Output",
        "estimated_latency": "Unknown",
        "estimated_cost": "Unknown",
        "complexity": "medium",
        "build_time_estimate": "2-5 days",
    }
