# Clarification loop — the "living case" engine.
#
# A student sends the organizer/DSO the verification email, gets a reply,
# and pastes it here. We detect what the reply clarifies, update the
# extracted fields, re-run the full deterministic pipeline, and diff the
# two analyses so the student sees exactly what changed and what still
# blocks them.
#
# Detection is deterministic phrase matching; the risk decision is the same
# auditable rule engine used for the original analysis. The output never
# asserts legal eligibility — a cleared citizenship question still leaves
# advisor/DSO verification standing when work authorization is in play.

from __future__ import annotations

import copy
import re
from datetime import date
from typing import Any, Optional

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
from ..workflow.timeline_simulator import simulate_timeline

# --- Signal patterns (matched against the lowered clarification text) ---

# Organizer confirms international students / F-1 may participate or that
# citizenship is not required.
_POSITIVE_ELIGIBILITY = [
    re.compile(r"f-?1 (?:visa )?students? (?:may|can|are (?:welcome|eligible) to) apply"),
    re.compile(r"international students? (?:may|can) apply"),
    re.compile(r"international students? are (?:eligible|welcome)"),
    re.compile(r"open to international students?"),
    re.compile(r"(?:citizenship|permanent residen\w+|green card) is not (?:a )?require\w+"),
    re.compile(r"(?:do|does|we do) not require (?:u\.?s\.? )?citizenship"),
    re.compile(r"no citizenship (?:requirement|restriction)"),
]

# Organizer confirms the restriction stands.
_NEGATIVE_ELIGIBILITY = [
    re.compile(r"(?:international students?|temporary visas?|f-?1 students?)"
               r"[^.\n]{0,80}(?:are |is )?not (?:be )?eligible"),
    re.compile(r"(?:must be|only) (?:a )?u\.?s\.? citizens?"),
    re.compile(r"citizens (?:only|or permanent residents only)"),
    re.compile(r"cannot accept (?:international|f-?1)"),
    re.compile(r"unable to (?:sponsor|accept international)"),
]

# Work authorization / CPT / OPT remains a live concern.
_WORK_AUTH_REMAINS = [
    re.compile(r"\bcpt\b"),
    re.compile(r"\bopt\b"),
    re.compile(r"work authorization"),
    re.compile(r"authoriz\w+ to work"),
    re.compile(r"coordinate with (?:their|your|the) (?:university|school|dso|"
               r"international student office)"),
    re.compile(r"confirm (?:cpt|opt|work eligibility|work authorization)"),
]

_FUNDING_RESTRICTED = [
    re.compile(r"funding (?:is |remains |may be )?restricted"),
    re.compile(r"stipend[^.\n]{0,60}(?:citizens|permanent residents) only"),
]

_CONFIRMS_PAID = re.compile(r"\b(?:paid|stipend|salary|compensated|hourly wage)\b")
_CONFIRMS_UNPAID = re.compile(r"\bunpaid\b|no (?:compensation|stipend|pay)\b")

CASE_STATUSES = {
    "not_eligible": "Likely not eligible — organizer confirmed the restriction",
    "conditional": "Conditionally possible — advisor verification needed",
    "still_unclear": "Still unclear — follow up with the organizer",
    "low": "Low risk — verify the basics, then proceed",
    "high": "High risk — do not assume eligibility",
    "verify": "Unclear — verify before applying",
}

RECOMMENDATIONS = {
    "not_eligible": (
        "The organizer's reply indicates this opportunity is restricted by "
        "citizenship or visa status. This appears likely restricted for you — "
        "ask whether exceptions or related programs exist, and prioritize "
        "other opportunities."
    ),
    "conditional": (
        "The organizer clarified that international students may apply, but "
        "work authorization (CPT/OPT) coordination is still required. Bring "
        "this reply to your DSO/advisor before accepting — do not assume the "
        "authorization timeline fits the start date."
    ),
    "still_unclear": (
        "The reply did not clearly resolve the open eligibility questions. "
        "Send a follow-up asking the specific unanswered questions from the "
        "verification kit, and do not invest heavily until clarified."
    ),
    "low": (
        "No major restriction remains after this clarification. Verify the "
        "remaining basics with your advisor and keep the organizer's written "
        "reply with your application materials."
    ),
    "high": (
        "Significant risk signals remain after this clarification. Do not "
        "assume eligibility — continue verification with the organizer and "
        "your DSO before applying or accepting."
    ),
    "verify": (
        "Some eligibility questions remain open. Continue the verification "
        "steps below before applying or accepting."
    ),
}


def _matched_sentence(text: str, pattern: re.Pattern) -> Optional[str]:
    """Return the full sentence containing the first match, for evidence."""
    match = pattern.search(text)
    if not match:
        return None
    start = text.rfind(".", 0, match.start()) + 1
    end = text.find(".", match.end())
    end = len(text) if end == -1 else end + 1
    return text[start:end].strip()


def _detect_signals(clarification: str) -> dict[str, Any]:
    lowered = clarification.lower()
    signals: dict[str, Any] = {
        "positive_eligibility": None,
        "negative_eligibility": None,
        "work_auth_remains": None,
        "funding_restricted": None,
        "confirms_paid": False,
        "confirms_unpaid": False,
    }
    for pat in _NEGATIVE_ELIGIBILITY:
        sentence = _matched_sentence(lowered, pat)
        if sentence:
            signals["negative_eligibility"] = sentence
            break
    if not signals["negative_eligibility"]:
        for pat in _POSITIVE_ELIGIBILITY:
            sentence = _matched_sentence(lowered, pat)
            if sentence:
                signals["positive_eligibility"] = sentence
                break
    for pat in _WORK_AUTH_REMAINS:
        sentence = _matched_sentence(lowered, pat)
        if sentence:
            signals["work_auth_remains"] = sentence
            break
    for pat in _FUNDING_RESTRICTED:
        sentence = _matched_sentence(lowered, pat)
        if sentence:
            signals["funding_restricted"] = sentence
            break
    if _CONFIRMS_UNPAID.search(lowered):
        signals["confirms_unpaid"] = True
    elif _CONFIRMS_PAID.search(lowered):
        signals["confirms_paid"] = True
    signals["vague"] = not any([
        signals["positive_eligibility"], signals["negative_eligibility"],
        signals["work_auth_remains"], signals["funding_restricted"],
        signals["confirms_paid"], signals["confirms_unpaid"],
    ])
    return signals


def _blocker_labels(graph: dict[str, Any]) -> list[str]:
    """Labels of nodes that represent live blockers/warnings (not the
    bookkeeping start/decision nodes)."""
    skip = {"opportunity_uploaded", "decision"}
    return [
        n["label"] for n in graph.get("nodes") or []
        if n.get("id") not in skip and n.get("status") in {"blocked", "warning"}
    ]


def _apply_signals(
    extracted: dict[str, Any], signals: dict[str, Any], source: str
) -> list[str]:
    """Mutate a copy of the extracted fields per the clarification.
    Returns human-readable change notes."""
    changes: list[str] = []
    who = "advisor" if source == "advisor" else "organizer"

    def add_evidence(field: str, value: str, sentence: str) -> None:
        extracted.setdefault("evidence", []).append({
            "field": field,
            "value": value,
            "source_text": sentence,
            "confidence": 0.85,
        })

    if signals["negative_eligibility"]:
        sentence = signals["negative_eligibility"]
        extracted["international_eligibility"] = "likely_not_eligible"
        extracted["citizenship_requirement"] = sentence
        add_evidence("international_eligibility", "likely_not_eligible", sentence)
        changes.append(
            f"The {who} confirmed the citizenship/visa restriction stands."
        )
    elif signals["positive_eligibility"]:
        sentence = signals["positive_eligibility"]
        extracted["citizenship_requirement"] = None
        extracted["international_eligibility"] = "likely_eligible"
        add_evidence("international_eligibility", "likely_eligible", sentence)
        changes.append(
            f"The {who} clarified that international students may apply — "
            "citizenship/residency is not required."
        )

    if signals["work_auth_remains"]:
        sentence = signals["work_auth_remains"]
        extracted["work_authorization_language"] = sentence
        add_evidence("work_authorization_language", sentence, sentence)
        changes.append(
            "Work authorization (CPT/OPT) coordination is still required — "
            "this needs your DSO/advisor."
        )

    if signals["funding_restricted"]:
        sentence = signals["funding_restricted"]
        extracted["funding_restriction"] = sentence
        add_evidence("funding_restriction", sentence, sentence)
        changes.append("Funding restrictions were confirmed in the reply.")

    if signals["confirms_unpaid"]:
        if extracted.get("paid_status") != "unpaid":
            extracted["paid_status"] = "unpaid"
            changes.append("The reply confirms the role is unpaid.")
    elif signals["confirms_paid"]:
        if extracted.get("paid_status") != "paid":
            extracted["paid_status"] = "paid"
            changes.append("The reply confirms the role is paid.")

    return changes


def _case_status_key(
    signals: dict[str, Any], level_after: str
) -> str:
    if signals["negative_eligibility"]:
        return "not_eligible"
    if signals["positive_eligibility"] and signals["work_auth_remains"]:
        return "conditional"
    if signals["vague"]:
        return "still_unclear"
    if level_after == "low":
        return "low"
    if level_after == "high":
        return "high"
    return "verify"


def _reword_for_clarification(risk: dict[str, Any], signals: dict[str, Any]) -> None:
    """The scorer's generic 'open worldwide' wording is wrong when the
    -35 came from an organizer reply — say what actually happened."""
    if not signals.get("positive_eligibility"):
        return
    old = "Opportunity appears open worldwide, which lowers risk"
    new = ("Organizer confirmed international students may apply, "
           "which lowers risk")
    risk["reasons"] = [new if r == old else r for r in risk.get("reasons") or []]
    for item in risk.get("score_breakdown") or []:
        if item.get("label") == "Opportunity appears open worldwide":
            item["label"] = "Organizer confirmed international students may apply"
            if not item.get("evidence"):
                item["evidence"] = signals["positive_eligibility"]


def analyze_clarification(
    original_analysis: dict[str, Any],
    clarification_text: str,
    clarification_source: str = "organizer",
    student_status: str = "f1",
    today: Optional[date] = None,
) -> dict[str, Any]:
    signals = _detect_signals(clarification_text)

    extracted = copy.deepcopy(original_analysis.get("extracted") or {})
    change_summary = _apply_signals(extracted, signals, clarification_source)

    # Re-run the same deterministic pipeline on the updated fields.
    risk = calculate_risk(extracted, student_status=student_status, today=today)
    _reword_for_clarification(risk, signals)
    graph = build_graph(risk)
    timeline = simulate_timeline(extracted.get("deadline_or_start_date"), today=today)

    partial = {"extracted": extracted, "risk": risk, "timeline": timeline}
    email = build_organizer_email(partial)
    verification = {
        "organizer_questions": generate_organizer_questions(partial),
        "advisor_questions": generate_advisor_questions(partial),
        "email_draft": f"Subject: {email['subject']}\n\n{email['body']}",
        "next_steps": generate_next_steps(partial),
        "disclaimer": DISCLAIMER,
    }

    updated: dict[str, Any] = {
        "extracted": extracted,
        "risk": risk,
        "graph": graph,
        "timeline": timeline,
        "verification": verification,
    }
    updated["report_markdown"] = generate_markdown_report(updated, today=today)

    # --- Case diff ---
    risk_before = original_analysis.get("risk") or {}
    blockers_before = _blocker_labels(original_analysis.get("graph") or {})
    blockers_after = _blocker_labels(graph)
    resolved = [b for b in blockers_before if b not in blockers_after]
    remaining = list(blockers_after)
    if timeline.get("risk_level") in {"high", "medium_high"}:
        remaining.append("Deadline is close — verification time is tight")

    status_key = _case_status_key(signals, risk["level"])

    if signals["vague"]:
        change_summary.append(
            "The reply did not contain clear eligibility signals — "
            "uncertainty is preserved."
        )
    score_before = risk_before.get("score")
    if score_before is not None:
        delta = risk["score"] - score_before
        direction = "decreased" if delta < 0 else "increased" if delta > 0 else "did not change"
        change_summary.append(
            f"Risk score {direction}: {score_before} → {risk['score']}."
        )

    case_diff = {
        "score_before": score_before,
        "score_after": risk["score"],
        "level_before": risk_before.get("level"),
        "level_after": risk["level"],
        "resolved_blockers": resolved,
        "remaining_blockers": remaining,
        "case_status": CASE_STATUSES[status_key],
        "new_recommendation": RECOMMENDATIONS[status_key],
        "change_summary": change_summary,
        "signals_detected": {k: v for k, v in signals.items() if v},
    }

    return {"updated_analysis": updated, "case_diff": case_diff}
