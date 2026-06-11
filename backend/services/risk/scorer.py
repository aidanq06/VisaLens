# Deterministic risk scoring engine.
# Mirrors frontend/lib/analyze/riskScoring.ts — the team's agreed rule set:
#
#   U.S. citizens / PR only        +85..90
#   Eligible to work in the U.S.   +45
#   Paid role                      +25
#   Paid + work auth language      +20 (additional)
#   Open worldwide                 -35
#   Unclear eligibility            +20
#   Funding citizenship-restricted +50
#
# The AI extracts fields; this module computes risk with transparent,
# explainable rules. No LLM involved — every point is auditable.

from __future__ import annotations

from datetime import date
from typing import Any

from ..workflow.timeline_simulator import simulate_timeline

LEVEL_SCORE = {"low": 10, "moderate": 40, "medium_high": 70, "high": 90}

MAIN_LABEL = {
    "low": "Low risk — verify the basics, then proceed",
    "moderate": "Some risk — verify before applying",
    "medium_high": "Unclear — verify before applying",
    "high": "High risk — do not assume eligibility",
}


def score_to_level(score: float) -> str:
    # Keep thresholds in sync with frontend/lib/riskColors.ts scoreToLevel().
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium_high"
    if score >= 25:
        return "moderate"
    return "low"


def _cat(score: float, explanation: str) -> dict[str, Any]:
    clamped = max(0, min(100, round(score)))
    return {"level": score_to_level(clamped), "score": clamped, "explanation": explanation}


def _contains_any(value: str | None, *needles: str) -> bool:
    if not value:
        return False
    lowered = value.lower()
    return any(n in lowered for n in needles)


def calculate_risk(
    extracted: dict[str, Any],
    student_status: str = "f1",
    today: date | None = None,
) -> dict[str, Any]:
    """Compute the shared-schema risk object from extracted fields.

    `student_status` is one of: f1, j1, international_other, domestic, unsure.
    """
    reasons: list[str] = []
    score = 0

    citizenship = extracted.get("citizenship_requirement") or ""
    citizens_only = _contains_any(
        citizenship, "citizens only", "not eligible", "u.s. citizen"
    ) and not _contains_any(citizenship, "permanent resident")
    pr_or_citizens = _contains_any(citizenship, "permanent resident", "green card")
    restricted = citizens_only or pr_or_citizens

    work_auth = extracted.get("work_authorization_language")
    has_work_auth = bool(work_auth) and not _contains_any(
        work_auth, "no work authorization"
    )
    is_paid = extracted.get("paid_status") == "paid"
    intl_elig = extracted.get("international_eligibility") or "unknown"
    worldwide = intl_elig == "likely_eligible" or _contains_any(
        extracted.get("remote_or_global_status"), "worldwide", "global"
    )
    funding_restricted = _contains_any(
        extracted.get("funding_restriction"),
        "restricted", "citizen", "federal", "nsf", "residency",
    )
    unclear = intl_elig in {"unclear", "unknown"}

    # --- Apply the agreed rules ---
    if citizens_only:
        score += 90
        reasons.append("Listing restricts participation to U.S. citizens only")
    elif pr_or_citizens:
        score += 85
        reasons.append(
            "Listing restricts participation to U.S. citizens or permanent residents"
        )
    if has_work_auth:
        score += 45
        reasons.append("Work authorization language detected")
    if is_paid:
        score += 25
        reasons.append("Paid role detected")
    if is_paid and has_work_auth:
        score += 20
        reasons.append(
            "Paid role combined with work authorization language increases risk"
        )
    if worldwide and not restricted:
        score -= 35
        reasons.append("Opportunity appears open worldwide, which lowers risk")
    if unclear and not restricted:
        score += 20
        reasons.append("International eligibility is not clearly stated")
    if funding_restricted:
        score += 50
        reasons.append("Funding appears restricted by citizenship or residency")

    # --- Student context adjustment ---
    if student_status == "domestic":
        score = round(score * 0.2)
        reasons.append(
            "You indicated domestic status, so visa-related risks largely do not "
            "apply — verify other requirements normally"
        )
    elif student_status == "unsure":
        reasons.append("Status marked as unsure — treat visa-related risks cautiously")

    score = max(0, min(100, score))
    intl = student_status != "domestic"

    # --- Category breakdown ---
    if citizens_only:
        cat_citizenship = _cat(
            90, "The listing explicitly requires U.S. citizenship."
        )
    elif pr_or_citizens:
        cat_citizenship = _cat(
            85, "The listing restricts eligibility to citizens or permanent residents."
        )
    elif unclear:
        cat_citizenship = _cat(
            35,
            "No explicit citizenship restriction was found, but eligibility is "
            "not fully clear.",
        )
    else:
        cat_citizenship = _cat(10, "No citizenship restriction detected.")

    if has_work_auth:
        cat_work_auth = _cat(
            90,
            f'The listing includes work-eligibility language: "{work_auth}".',
        )
    elif is_paid and intl:
        cat_work_auth = _cat(
            40,
            "No explicit work-authorization language, but paid roles may still "
            "require it.",
        )
    else:
        cat_work_auth = _cat(10, "No work-authorization language detected.")

    if is_paid:
        cat_paid = _cat(
            75 if intl else 25,
            "Paid roles may require work authorization for international students."
            if intl
            else "Paid role detected.",
        )
    elif extracted.get("paid_status") == "unpaid":
        cat_paid = _cat(10, "The opportunity appears to be unpaid or volunteer-based.")
    else:
        cat_paid = _cat(30, "Payment status could not be determined from the listing.")

    location = extracted.get("location_requirement")
    if worldwide or _contains_any(location, "worldwide", "online", "remote"):
        cat_location = _cat(5, "The opportunity appears open worldwide or remote.")
    elif location:
        cat_location = _cat(
            45, "The opportunity appears to be U.S.-based or requires U.S. presence."
        )
    else:
        cat_location = _cat(20, "No explicit location requirement detected.")

    funding = extracted.get("funding_restriction")
    cat_funding = (
        _cat(85, f'Funding language detected: "{funding}".')
        if funding_restricted
        else _cat(10, "No explicit funding restriction was found.")
    )

    if restricted:
        cat_ambiguity = _cat(
            20,
            "The restriction language is explicit, so there is little ambiguity — "
            "but confirm with the organizer if your situation may be an exception.",
        )
    elif unclear and intl:
        cat_ambiguity = _cat(
            85,
            "The listing does not clearly state whether international students "
            "are eligible.",
        )
    else:
        cat_ambiguity = _cat(15, "Eligibility language is relatively clear.")

    # Timeline category from the simulator (single source of truth).
    timeline_result = simulate_timeline(
        extracted.get("deadline_or_start_date"), today=today
    )
    days_left = timeline_result["days_until_deadline"]
    cat_timeline = _cat(
        LEVEL_SCORE[timeline_result["risk_level"]],
        "No deadline detected."
        if days_left is None
        else (
            f"About {days_left} days remain; verification needs roughly "
            f"{timeline_result['estimated_verification_days']}."
        ),
    )
    if timeline_result["risk_level"] in {"high", "medium_high"}:
        reasons.append("Deadline or start date is close — verification time is tight")

    level = score_to_level(score)
    return {
        "score": score,
        "level": level,
        "main_label": MAIN_LABEL[level],
        "summary": _build_summary(
            level, restricted, has_work_auth, is_paid, worldwide, student_status
        ),
        "categories": {
            "citizenship": cat_citizenship,
            "work_authorization": cat_work_auth,
            "paid_role": cat_paid,
            "location": cat_location,
            "funding": cat_funding,
            "ambiguity": cat_ambiguity,
            "timeline": cat_timeline,
        },
        "reasons": reasons,
    }


def _build_summary(
    level: str,
    restricted: bool,
    has_work_auth: bool,
    is_paid: bool,
    worldwide: bool,
    student_status: str,
) -> str:
    # Responsible language only: surface what may need verification,
    # never assert legal eligibility or ineligibility.
    if student_status == "domestic":
        return (
            "You indicated domestic status, so visa-related restrictions largely "
            "do not apply to you. Review the remaining requirements normally."
        )
    if restricted:
        return (
            "The listing appears to restrict participation by citizenship or "
            "residency status, which suggests international students may not be "
            "eligible. Confirm with the organizer before investing time in an "
            "application — and ask whether exceptions or related programs exist."
        )
    if is_paid and has_work_auth:
        return (
            "This opportunity may be possible for international students, but the "
            "paid role combined with explicit work authorization language makes "
            "eligibility uncertain. Do not assume you are eligible without "
            "written confirmation from the organizer and your advisor or DSO."
        )
    if worldwide:
        return (
            "No major eligibility blockers were detected and the opportunity "
            "appears open to students worldwide. Verify the remaining details — "
            "especially anything about prizes, payments, or location — before "
            "applying."
        )
    return (
        "Some eligibility details are unclear from the listing. Use the "
        "verification kit below to confirm with the organizer and your advisor "
        "before applying."
    )
