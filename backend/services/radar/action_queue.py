# Opportunity Action Queue.
# Turns radar discoveries + VisaLens risk analysis into a daily decision
# system: not just "here are roles" but "here is what to do first today".
#
# Fully deterministic and explainable — every label and every point in the
# action score has a stated reason. No LLM involved.

from __future__ import annotations

import json
from typing import Any, Optional

from .db import get_conn, init_db, rows_to_dicts
from .scoring import SOURCE_OF_TRUTH_TYPES

# Display order = priority order for "what should I look at first".
ACTION_LABELS = [
    "apply_now",
    "verify_first",
    "ask_advisor",
    "watch",
    "likely_blocked",
    "low_priority",
]

ACTION_TITLES = {
    "apply_now": "Apply now",
    "verify_first": "Verify first",
    "ask_advisor": "Ask DSO/advisor first",
    "watch": "Watch / save",
    "likely_blocked": "Likely blocked",
    "low_priority": "Low priority",
}

NEXT_STEPS = {
    "apply_now": [
        "Open the application and start your draft today — fresh roles fill fast.",
        "Skim the eligibility report once before submitting to confirm nothing changed.",
    ],
    "verify_first": [
        "Send the organizer the verification email from the eligibility report.",
        "Hold off on long application work until eligibility is clarified in writing.",
    ],
    "ask_advisor": [
        "Bring the eligibility report to your DSO/advisor — CPT/OPT may be required.",
        "Ask the organizer to confirm international student eligibility in writing.",
    ],
    "watch": [
        "Save it and revisit after today's higher-priority roles.",
    ],
    "likely_blocked": [
        "This listing appears restricted by citizenship, residency, or funding.",
        "Only pursue if the organizer confirms an exception applies to your status.",
    ],
    "low_priority": [
        "No action needed today.",
    ],
}

_HIGHISH = {"medium_high", "high"}


def _category_levels(visa_analysis_json: Optional[str]) -> dict[str, str]:
    """Pull per-category risk levels out of the stored VisaLensAnalysis."""
    if not visa_analysis_json:
        return {}
    try:
        analysis = json.loads(visa_analysis_json)
        categories = (analysis.get("risk") or {}).get("categories") or {}
        return {k: (v or {}).get("level") or "low" for k, v in categories.items()}
    except (ValueError, AttributeError):
        return {}


def classify(opp: dict[str, Any], cats: dict[str, str]) -> tuple[str, list[str]]:
    """Deterministic action label + the reasons that led to it.

    Rule order matters: explicit blockers first, then advisor concerns,
    then organizer-verification cases, then fit/freshness cutoffs.
    """
    fit = float(opp.get("fit_score") or 0)
    fresh = float(opp.get("freshness_score") or 0)
    risk_level = opp.get("visa_risk_level") or "unknown"
    reasons: list[str] = []

    citizenship_blocked = cats.get("citizenship") == "high"
    funding_blocked = cats.get("funding") == "high"
    explicit_work_auth = cats.get("work_authorization") == "high"
    # paid_role lands at "high" when the listing is confirmed paid and the
    # student is international — the classic CPT/OPT-coordination case.
    paid_intl_concern = cats.get("paid_role") == "high"

    if citizenship_blocked or funding_blocked:
        if citizenship_blocked:
            reasons.append("explicit citizenship/residency restriction detected")
        if funding_blocked:
            reasons.append("funding appears restricted by citizenship or residency")
        return "likely_blocked", reasons

    if explicit_work_auth or paid_intl_concern:
        if explicit_work_auth:
            reasons.append("work authorization language detected")
        if paid_intl_concern:
            reasons.append("confirmed paid role — CPT/OPT coordination may be "
                           "required before starting")
        if fit < 45:
            reasons.append("fit too low to prioritize the advisor conversation today")
            return "low_priority", reasons
        return "ask_advisor", reasons

    if risk_level in _HIGHISH:
        reasons.append(f"visa risk is {risk_level.replace('_', '-')} — eligibility unclear")
        if fit >= 45 and fresh >= 30:
            reasons.append("strong enough fit to be worth clarifying with the organizer")
            return "verify_first", reasons
        reasons.append("fit/freshness too low to prioritize clarification today")
        return "low_priority", reasons

    if fit >= 55 and fresh >= 50:
        reasons.append(f"high fit ({round(fit)}) and fresh ({round(fresh)})")
        if risk_level in {"low", "moderate"}:
            reasons.append("no major eligibility restriction detected")
        else:
            reasons.append("eligibility analysis pending — skim the report before applying")
        return "apply_now", reasons

    if fit >= 55:
        reasons.append(f"good fit ({round(fit)}) but no longer fresh")
        return "watch", reasons

    reasons.append("low fit or stale posting")
    return "low_priority", reasons


def action_score(opp: dict[str, Any], cats: dict[str, str]) -> tuple[float, list[str]]:
    """0-100 ranking score within the queue, with point-by-point reasons."""
    fit = float(opp.get("fit_score") or 0)
    fresh = float(opp.get("freshness_score") or 0)
    risk_score = opp.get("visa_risk_score")
    reasons: list[str] = []

    score = 0.40 * fit + 0.35 * fresh
    reasons.append(f"+{round(0.40 * fit)} fit contribution")
    reasons.append(f"+{round(0.35 * fresh)} freshness contribution")

    if (opp.get("source_type") or "") in SOURCE_OF_TRUTH_TYPES:
        score += 10
        reasons.append("+10 direct source-of-truth posting")

    season = (opp.get("season") or "").lower()
    if any(s in season for s in ("2026", "2027", "co-op")):
        score += 5
        reasons.append(f"+5 target season ({opp.get('season')})")

    # Unknown risk is treated as mild uncertainty, not as safe.
    risk_penalty = round(0.30 * (risk_score if risk_score is not None else 40))
    if risk_penalty:
        score -= risk_penalty
        reasons.append(f"-{risk_penalty} visa risk penalty")

    if cats.get("citizenship") == "high" or cats.get("funding") == "high":
        score -= 25
        reasons.append("-25 explicit blocker penalty")

    return max(0.0, min(100.0, round(score, 1))), reasons


def build_action_queue(limit: int = 300) -> dict[str, Any]:
    init_db()
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT id, company_name, title, location, season, apply_url,
                      source_type, is_source_of_truth, first_seen_at,
                      fit_score, freshness_score, urgency_score,
                      visa_risk_score, visa_risk_level, status, visa_analysis
               FROM opportunities
               WHERE active = 1 AND status != 'hidden'
               ORDER BY urgency_score DESC
               LIMIT ?""",
            (min(limit, 500),),
        ).fetchall()
        opps = rows_to_dicts(rows)
    finally:
        conn.close()

    items: list[dict[str, Any]] = []
    counts = {label: 0 for label in ACTION_LABELS}

    for opp in opps:
        cats = _category_levels(opp.pop("visa_analysis", None))
        label, label_reasons = classify(opp, cats)
        score, score_reasons = action_score(opp, cats)
        counts[label] += 1
        items.append({
            **opp,
            "has_analysis": bool(cats),
            "action_label": label,
            "action_title": ACTION_TITLES[label],
            "action_score": score,
            "reasons": label_reasons,
            "score_reasons": score_reasons,
            "next_steps": NEXT_STEPS[label],
        })

    label_rank = {label: i for i, label in enumerate(ACTION_LABELS)}
    items.sort(key=lambda x: (label_rank[x["action_label"]], -x["action_score"]))

    return {
        "counts": counts,
        "total": len(items),
        # Conservative estimate for the impact strip: manually opening a
        # posting, reading it, and judging eligibility takes ~10 minutes.
        "estimated_minutes_saved": len(items) * 10,
        "items": items,
    }
