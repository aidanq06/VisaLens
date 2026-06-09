"""
Normalizes raw extracted data and infers eligibility from field combinations.

normalize_extraction() sanitizes a raw dict before it is passed into
ExtractedOpportunity. infer_international_eligibility() derives a best-guess
eligibility label from the combination of citizenship, work-auth, and location
fields when the LLM or phrase rules did not produce a conclusive signal.
"""

from typing import Any

_VALID_PAID_STATUS = {"paid", "unpaid", "unknown"}
_VALID_INTL_ELIGIBILITY = {"likely_eligible", "likely_not_eligible", "unclear", "unknown"}

_OPTIONAL_FIELDS = {
    "work_authorization_language",
    "citizenship_requirement",
    "location_requirement",
    "deadline_or_start_date",
    "funding_restriction",
    "student_level_requirement",
    "remote_or_global_status",
}

_LIST_FIELDS = {"required_materials", "ambiguous_phrases"}


def _dedupe_ordered(items: list) -> list:
    seen: set = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def normalize_extraction(raw: dict) -> dict:
    out: dict[str, Any] = dict(raw)

    # Validate enum-like literals, fall back to "unknown"
    if out.get("paid_status") not in _VALID_PAID_STATUS:
        out["paid_status"] = "unknown"

    if out.get("international_eligibility") not in _VALID_INTL_ELIGIBILITY:
        out["international_eligibility"] = "unknown"

    # Strip whitespace and coerce empty strings to None for optional fields
    for field in _OPTIONAL_FIELDS:
        val = out.get(field)
        if isinstance(val, str):
            val = val.strip()
            out[field] = val if val else None

    # Strip opportunity_type if present
    if isinstance(out.get("opportunity_type"), str):
        out["opportunity_type"] = out["opportunity_type"].strip()

    # Deduplicate list fields while preserving insertion order
    for field in _LIST_FIELDS:
        items = out.get(field)
        if isinstance(items, list):
            out[field] = _dedupe_ordered(
                item.strip() if isinstance(item, str) else item
                for item in items
            )

    return out


def infer_international_eligibility(extracted: dict) -> str:
    citizenship = extracted.get("citizenship_requirement") or ""
    work_auth = extracted.get("work_authorization_language")
    paid = extracted.get("paid_status")
    intl = extracted.get("international_eligibility") or ""
    location = extracted.get("location_requirement") or ""

    if citizenship and (
        "citizens only" in citizenship.lower()
        or "not eligible" in citizenship.lower()
    ):
        return "likely_not_eligible"

    if work_auth and paid == "paid":
        return "unclear"

    if intl == "likely_eligible":
        return "likely_eligible"

    if location and (
        "worldwide" in location.lower()
        or "global" in location.lower()
    ):
        return "likely_eligible"

    return "unknown"
