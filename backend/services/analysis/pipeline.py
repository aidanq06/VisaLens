# Full analysis pipeline.
# Composes every service into the shared VisaLensAnalysis schema that the
# frontend (frontend/types/analysis.ts) renders directly:
#
#   extraction  -> risk scoring -> blocker graph -> timeline -> verification kit
#
# Extraction may use an LLM; everything downstream is deterministic and
# auditable. The output never asserts legal eligibility — it surfaces what
# may need verification.

from __future__ import annotations

import re
from datetime import date
from typing import Any, Optional

from ..extraction.extractor import ExtractionEngine
from ..report.markdown_report import generate_markdown_report
from ..risk.scorer import calculate_risk
from ..verification.email_generator import build_organizer_email
from ..verification.question_generator import (
    DISCLAIMER,
    generate_advisor_questions,
    generate_next_steps,
    generate_organizer_questions,
)
from ..workflow.graph_builder import build_graph
from ..workflow.timeline_simulator import days_until, simulate_timeline

_DATE_PATTERNS = [
    re.compile(
        r"\b(?:january|february|march|april|may|june|july|august|september|"
        r"october|november|december)\s+\d{1,2},?\s+\d{4}\b",
        re.IGNORECASE,
    ),
    re.compile(r"\b\d{1,2}/\d{1,2}/\d{4}\b"),
    re.compile(r"\b\d{4}-\d{2}-\d{2}\b"),
]

_STATUS_MAP = {
    "f-1": "f1",
    "f1": "f1",
    "j-1": "j1",
    "j1": "j1",
    "international_other": "international_other",
    "domestic": "domestic",
    "unsure": "unsure",
}


def _resolve_deadline(
    extracted_value: Optional[str], text: str, override: Optional[str]
) -> Optional[str]:
    """Pick the best concrete date string available.

    Phrase rules sometimes record the label "date_mention" instead of the
    actual date, so fall back to scanning the raw text for a parseable date.
    An explicit override from the scan form always wins.
    """
    if override and days_until(override) is not None:
        return override
    if extracted_value and days_until(extracted_value) is not None:
        return extracted_value
    for pattern in _DATE_PATTERNS:
        match = pattern.search(text)
        if match and days_until(match.group(0)) is not None:
            return match.group(0)
    return None


def run_analysis(
    title: str,
    text: str,
    student_status: str = "F-1",
    deadline_override: Optional[str] = None,
    opportunity_type_hint: Optional[str] = None,
    today: Optional[date] = None,
) -> dict[str, Any]:
    status = _STATUS_MAP.get(student_status.strip().lower(), "international_other")

    # 1. Extraction (rules + optional LLM)
    engine = ExtractionEngine()
    extracted = engine.extract(
        title=title, text=text, student_context=status
    ).model_dump()

    extracted["deadline_or_start_date"] = _resolve_deadline(
        extracted.get("deadline_or_start_date"), text, deadline_override
    )

    # The student picked the opportunity type on the scan form; their explicit
    # choice beats keyword tie-breaks like "AI research" inside an internship.
    if opportunity_type_hint and opportunity_type_hint.lower() not in {"", "other"}:
        extracted["opportunity_type"] = opportunity_type_hint.lower()

    # 2. Deterministic risk scoring
    risk = calculate_risk(extracted, student_status=status, today=today)

    # A hard citizenship restriction implies the listing is likely closed to
    # international students even when the extractor could not conclude it.
    if (
        risk["categories"]["citizenship"]["level"] == "high"
        and extracted.get("international_eligibility") in {"unknown", "unclear"}
    ):
        extracted["international_eligibility"] = "likely_not_eligible"

    # 3. Blocker graph + timeline (deterministic)
    graph = build_graph(risk)
    timeline = simulate_timeline(extracted.get("deadline_or_start_date"), today=today)

    # 4. Verification kit
    partial = {"extracted": extracted, "risk": risk, "timeline": timeline}
    email = build_organizer_email(partial)
    verification = {
        "organizer_questions": generate_organizer_questions(partial),
        "advisor_questions": generate_advisor_questions(partial),
        "email_draft": f"Subject: {email['subject']}\n\n{email['body']}",
        "next_steps": generate_next_steps(partial),
        "disclaimer": DISCLAIMER,
    }

    analysis: dict[str, Any] = {
        "extracted": extracted,
        "risk": risk,
        "graph": graph,
        "timeline": timeline,
        "verification": verification,
    }
    analysis["report_markdown"] = generate_markdown_report(analysis, today=today)
    return analysis
