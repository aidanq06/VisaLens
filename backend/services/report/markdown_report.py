# Markdown report generator.
# Mirrors frontend/lib/report/generateMarkdownReport.ts. Dependency-free.

from __future__ import annotations

from datetime import date
from typing import Any

from ..verification.question_generator import (
    DISCLAIMER,
    generate_advisor_questions,
    generate_next_steps,
    generate_organizer_questions,
)
from ..verification.email_generator import build_organizer_email

LEVEL_LABEL = {
    "low": "Low risk",
    "moderate": "Moderate risk",
    "medium_high": "Medium-high risk",
    "high": "High risk",
}


def generate_markdown_report(analysis: dict[str, Any], today: date | None = None) -> str:
    today = today or date.today()
    extracted = analysis.get("extracted") or {}
    risk = analysis.get("risk") or {}
    timeline = analysis.get("timeline") or {}
    verification = analysis.get("verification") or {}

    organizer_qs = verification.get("organizer_questions") or generate_organizer_questions(analysis)
    advisor_qs = verification.get("advisor_questions") or generate_advisor_questions(analysis)
    next_steps = verification.get("next_steps") or generate_next_steps(analysis)
    disclaimer = verification.get("disclaimer") or DISCLAIMER
    email = build_organizer_email(analysis)
    email_body = verification.get("email_draft") or email["body"]

    lines = [
        "# VisaLens AI — Opportunity Readiness Report",
        "",
        f"*Generated {today.strftime('%B %d, %Y')} by VisaLens AI*",
        "",
        "## Overall risk",
        "",
    ]

    if risk.get("score") is not None:
        lines += [
            f"**Score:** {risk['score']} / 100",
            f"**Level:** {LEVEL_LABEL.get(risk.get('level'), 'Pending')}",
        ]
    else:
        lines.append("_Risk analysis pending._")

    if risk.get("reasons"):
        lines += ["", "**Main concerns:**", ""]
        lines += [f"- {r}" for r in risk["reasons"]]

    lines += ["", "## Extracted opportunity details", ""]
    if extracted:
        rows = [
            ("Opportunity type", extracted.get("opportunity_type")),
            ("Paid status", extracted.get("paid_status")),
            ("Work authorization language", extracted.get("work_authorization_language")),
            ("Citizenship requirement", extracted.get("citizenship_requirement")),
            ("International eligibility", extracted.get("international_eligibility")),
            ("Location requirement", extracted.get("location_requirement")),
            ("Deadline / start date", extracted.get("deadline_or_start_date")),
        ]
        lines += ["| Field | Value |", "| --- | --- |"]
        lines += [f"| {label} | {value or 'not found'} |" for label, value in rows]
    else:
        lines.append("_Extraction pending._")

    lines += ["", "## Timeline", ""]
    if timeline:
        if timeline.get("days_until_deadline") is not None:
            lines.append(f"- **Days until deadline:** {timeline['days_until_deadline']}")
        if timeline.get("estimated_verification_days") is not None:
            lines.append(
                f"- **Estimated verification time:** {timeline['estimated_verification_days']} days"
            )
        if timeline.get("risk_level"):
            lines.append(f"- **Timeline risk:** {LEVEL_LABEL.get(timeline['risk_level'], '')}")
        if timeline.get("recommendation"):
            lines += ["", f"> {timeline['recommendation']}"]
    else:
        lines.append("_No timeline information available._")

    lines += ["", "## Questions for the organizer", ""]
    lines += [f"- {q}" for q in organizer_qs]

    lines += ["", "## Questions for your advisor/DSO", ""]
    lines += [f"- {q}" for q in advisor_qs]

    lines += [
        "",
        "## Email draft (organizer)",
        "",
        f"**Subject:** {email['subject']}",
        "",
        email_body,
        "",
        "## Next steps",
        "",
    ]
    lines += [f"{i + 1}. {step}" for i, step in enumerate(next_steps)]

    lines += ["", "## Disclaimer", "", f"*{disclaimer}*"]
    return "\n".join(lines)
