# FastAPI app entry point

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.extraction.extractor import ExtractionEngine
from services.extraction.schemas import ExtractedOpportunity

app = FastAPI(title="VisaLens AI - Extraction Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
