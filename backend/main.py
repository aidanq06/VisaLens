# FastAPI app entry point

from dotenv import load_dotenv
load_dotenv()

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.analysis.clarification import analyze_clarification
from services.analysis.pipeline import run_analysis
from services.extraction.extractor import ExtractionEngine
from services.extraction.schemas import ExtractedOpportunity
from services.radar.router import router as radar_router

app = FastAPI(title="VisaLens AI - Extraction Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(radar_router)


class ExtractionRequest(BaseModel):
    title: str
    text: str
    student_context: str = "unknown"


@app.get("/health")
def health():
    return {"status": "ok", "service": "visalens-extraction"}


@app.post("/api/extract", response_model=ExtractedOpportunity)
def extract(request: ExtractionRequest) -> ExtractedOpportunity:
    engine = ExtractionEngine()
    return engine.extract(
        title=request.title,
        text=request.text,
        student_context=request.student_context,
    )


class AnalyzeRequest(BaseModel):
    title: str = ""
    text: str
    student_status: str = "F-1"
    school_level: str = "college"
    opportunity_type: str = "other"
    deadline_override: Optional[str] = None


@app.post("/api/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    """Full pipeline: extraction -> risk -> graph -> timeline -> verification.

    Returns the complete VisaLensAnalysis object the frontend renders,
    plus a `report_markdown` export.
    """
    return run_analysis(
        title=request.title,
        text=request.text,
        student_status=request.student_status,
        deadline_override=request.deadline_override,
        opportunity_type_hint=request.opportunity_type,
    )


class ClarificationRequest(BaseModel):
    original_analysis: dict
    clarification_text: str
    clarification_source: str = "organizer"  # organizer | advisor | system
    student_status: str = "F-1"


@app.post("/api/analyze-clarification")
def clarify(request: ClarificationRequest) -> dict:
    """The living-case update: paste an organizer/advisor reply and get back
    the re-analyzed case plus a diff (score before/after, resolved blockers,
    remaining blockers, updated case status and recommendation)."""
    status_map = {
        "f-1": "f1", "f1": "f1", "j-1": "j1", "j1": "j1",
        "international_other": "international_other",
        "domestic": "domestic", "unsure": "unsure",
    }
    return analyze_clarification(
        original_analysis=request.original_analysis,
        clarification_text=request.clarification_text,
        clarification_source=request.clarification_source,
        student_status=status_map.get(
            request.student_status.strip().lower(), "international_other"
        ),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
