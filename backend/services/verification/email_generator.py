# Email draft generator.
# Mirrors the email builders in frontend/lib/verification/generateVerificationKit.ts.

from typing import Any

from .question_generator import AT_LEAST_MODERATE, _at_least_moderate, _is_paid

ORGANIZER_SUBJECT = "Clarification on international student eligibility"
ADVISOR_SUBJECT = "Question about opportunity eligibility and work authorization"


def build_organizer_email(analysis: dict[str, Any]) -> dict[str, str]:
    extracted = analysis.get("extracted") or {}
    opp_type = extracted.get("opportunity_type") or "opportunity"

    lines = [
        "Hello,",
        "",
        "I'm an international student currently enrolled at a U.S. university, "
        f"and I'm very interested in applying to this {opp_type}. Could you "
        "clarify whether F-1 international students are eligible?",
    ]
    if _is_paid(analysis) or _at_least_moderate(analysis, "work_authorization"):
        lines += [
            "",
            "I also wanted to ask whether the role is paid and whether "
            "participation may require work authorization such as CPT or OPT, "
            "so I can coordinate with my school's international student office "
            "if needed.",
        ]
    lines += ["", "Thank you for your time.", "", "Best regards,"]
    return {"subject": ORGANIZER_SUBJECT, "body": "\n".join(lines)}


def build_advisor_email(analysis: dict[str, Any]) -> dict[str, str]:
    extracted = analysis.get("extracted") or {}
    opp_type = extracted.get("opportunity_type") or "STEM opportunity"
    deadline = extracted.get("deadline_or_start_date")

    lines = [
        "Hello,",
        "",
        f"I found a {opp_type} that I'd like to apply for, but the listing "
        "includes language about U.S. work eligibility and the role may be "
        "paid. Before I apply or accept anything, could you help me understand "
        "whether this may require CPT, OPT, or another approval process for my "
        "visa status?",
    ]
    if deadline:
        lines += [
            "",
            f"The deadline or start date appears to be {deadline}, so I'd "
            "appreciate any guidance on how quickly verification can happen.",
        ]
    lines += ["", "Thank you.", "", "Best regards,"]
    return {"subject": ADVISOR_SUBJECT, "body": "\n".join(lines)}
