# Verification question generator.
# Mirrors frontend/lib/verification/generateVerificationKit.ts.
# Dependency-free: works on plain dicts in the shared schema.

from __future__ import annotations

from typing import Any

AT_LEAST_MODERATE = {"moderate", "medium_high", "high"}

DISCLAIMER = (
    "VisaLens does not provide legal, immigration, financial, or official "
    "eligibility advice. This analysis only highlights what may need "
    "verification. Confirm with official sources, your school's international "
    "student office, or the opportunity organizer before applying or accepting."
)


def _level(analysis: dict[str, Any], key: str) -> str | None:
    risk = analysis.get("risk") or {}
    cat = (risk.get("categories") or {}).get(key) or {}
    return cat.get("level")


def _at_least_moderate(analysis: dict[str, Any], key: str) -> bool:
    return _level(analysis, key) in AT_LEAST_MODERATE


def _is_paid(analysis: dict[str, Any]) -> bool:
    extracted = analysis.get("extracted") or {}
    return extracted.get("paid_status") == "paid" or _at_least_moderate(
        analysis, "paid_role"
    )


def generate_organizer_questions(analysis: dict[str, Any]) -> list[str]:
    questions = ["Do you accept F-1 or other international students?"]

    if _is_paid(analysis):
        questions.append(
            "Is this opportunity paid, and if so, would participation require "
            "work authorization?"
        )
    if _at_least_moderate(analysis, "work_authorization"):
        questions.append(
            "Would this role require CPT, OPT, or another form of U.S. work "
            "authorization?"
        )
    if _at_least_moderate(analysis, "citizenship"):
        questions.append(
            "Is U.S. citizenship or permanent residency required to participate?"
        )
    if _at_least_moderate(analysis, "funding"):
        questions.append(
            "Are there funding or stipend restrictions based on citizenship or "
            "residency status?"
        )
    if _level(analysis, "ambiguity") == "high":
        questions.append(
            "Could you confirm in writing whether international students are "
            "explicitly eligible?"
        )
    if _at_least_moderate(analysis, "location"):
        questions.append(
            "Is participation remote, in person, or hybrid — and are there "
            "location or residency constraints?"
        )
    return questions


def generate_advisor_questions(analysis: dict[str, Any]) -> list[str]:
    questions = []

    if _at_least_moderate(analysis, "work_authorization"):
        questions.append(
            "This opportunity mentions U.S. work eligibility — would it require "
            "work authorization for my visa status?"
        )
    if _is_paid(analysis):
        questions.append(
            "The role appears to be paid — might I need CPT, OPT, or another "
            "approval before accepting?"
        )
    if _at_least_moderate(analysis, "timeline"):
        questions.append(
            "How long does eligibility or authorization verification usually "
            "take, given the deadline is close?"
        )

    questions.append(
        "Is there anything else I should verify before applying or accepting "
        "this opportunity?"
    )
    return questions


def generate_next_steps(analysis: dict[str, Any]) -> list[str]:
    level = (analysis.get("risk") or {}).get("level") or "moderate"
    steps = ["Email the opportunity organizer with the questions above."]

    if level in {"high", "medium_high"}:
        steps += [
            "Contact your school's international student office or DSO before "
            "applying or accepting anything.",
            "Do not assume eligibility until you receive written confirmation.",
            "Save all written clarifications from the organizer and your advisor.",
        ]
    else:
        steps += [
            "Mention the opportunity to your advisor or international student "
            "office in case anything needs verification.",
            "Keep written confirmation of eligibility with your application "
            "materials.",
        ]

    if _at_least_moderate(analysis, "timeline"):
        steps.append(
            "Start verification today — the deadline leaves limited time for "
            "responses."
        )
    return steps
