from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class WorkflowExtractionRequest(BaseModel):
    transcript: str = Field(..., description="Raw transcript text (German or mixed)")
    context: Optional[str] = Field(None, description="Optional context about the meeting/customer")


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., description="Raw text from meeting notes or typed input")
    context: Optional[str] = Field(None, description="Optional context")


class WorkflowTrigger(BaseModel):
    event: str
    frequency: Optional[str] = None
    source_system: Optional[str] = None


class WorkflowAction(BaseModel):
    step: int
    action: str
    actor: str  # human or system
    tool: Optional[str] = None
    manual: bool = True


class IntegrationPoint(BaseModel):
    tool: str
    type: str  # input, output, both
    api_available: bool = True
    notes: Optional[str] = None


class EdgeCase(BaseModel):
    scenario: str
    handling: str


class WorkflowExtractionResponse(BaseModel):
    # Raw understanding
    summary: str
    language_detected: str = "de"
    customer_team: Optional[str] = None
    pain_points: List[str] = []

    # Structured workflow
    trigger: Optional[WorkflowTrigger] = None
    actions: List[WorkflowAction] = []
    stakeholders: List[str] = []
    integration_points: List[IntegrationPoint] = []
    edge_cases: List[EdgeCase] = []

    # Automation signal
    automation_score: int = Field(..., ge=0, le=10, description="How automatable is this? 0-10")
    automation_rationale: str = ""
    priority: str = "medium"  # low, medium, high, critical


class AgentDesignRequest(BaseModel):
    workflow: WorkflowExtractionResponse


class SpecGenerationRequest(BaseModel):
    workflow: WorkflowExtractionResponse
    agent_design: Dict[str, Any]
