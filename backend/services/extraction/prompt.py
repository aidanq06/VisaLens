"""
Builds the LLM prompt and parses the response safely.

build_extraction_prompt() assembles the full instruction string sent to the
LLM. parse_llm_response() cleans and deserializes the raw model output,
returning a guaranteed-safe default dict if the response cannot be parsed.
"""

import copy
import json
import logging
import re

logger = logging.getLogger(__name__)

_SAFE_DEFAULT: dict = {
    "opportunity_type": "unknown",
    "paid_status": "unknown",
    "work_authorization_language": None,
    "citizenship_requirement": None,
    "international_eligibility": "unknown",
    "location_requirement": None,
    "deadline_or_start_date": None,
    "funding_restriction": None,
    "student_level_requirement": None,
    "remote_or_global_status": None,
    "required_materials": [],
    "ambiguous_phrases": [],
    "evidence": [],
}

_CODE_FENCE_RE = re.compile(r"^```(?:json)?\s*|```\s*$", re.MULTILINE)


def build_extraction_prompt(
    title: str,
    text: str,
    student_context: str,
    schema_example: str,
) -> str:
    return (
        "You are a document intelligence engine for VisaLens AI. "
        "Your job is to extract structured eligibility fields from opportunity descriptions.\n\n"
        "Return ONLY valid JSON matching the schema below. "
        "No explanation, no markdown, no code fences, no extra text.\n\n"
        f"SCHEMA:\n{schema_example}\n\n"
        f"STUDENT CONTEXT:\n{student_context}\n\n"
        f"OPPORTUNITY TITLE:\n{title}\n\n"
        f"OPPORTUNITY TEXT:\n{text}\n\n"
        "Return ONLY the JSON object. Do not include any other text before or after it."
    )


def parse_llm_response(raw_response: str) -> dict:
    cleaned = _CODE_FENCE_RE.sub("", raw_response).strip()
    try:
        return json.loads(cleaned)
    except (json.JSONDecodeError, ValueError) as exc:
        logger.warning("Failed to parse LLM response: %s | raw: %.200r", exc, raw_response)
        return copy.deepcopy(_SAFE_DEFAULT)
