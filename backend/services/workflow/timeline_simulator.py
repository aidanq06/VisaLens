# Timeline risk simulator.
# Mirrors frontend/lib/timelineSimulator.ts. Returns the shared-schema
# "timeline" object.

from __future__ import annotations

from datetime import date, datetime, timedelta

DEFAULT_INPUTS = {
    "organizer_response_days": 2,
    "advisor_response_days": 2,
    "student_decision_days": 1,
}

STEPS = [
    ("Organizer response", "organizer_response_days"),
    ("Advisor/DSO clarification", "advisor_response_days"),
    ("Student decision", "student_decision_days"),
]


def days_until(date_str: str | None, today: date | None = None) -> int | None:
    """Days from today until an ISO-ish date string. None if unparseable."""
    if not date_str:
        return None
    today = today or date.today()
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            target = datetime.strptime(date_str.strip(), fmt).date()
            return (target - today).days
        except ValueError:
            continue
    return None


def simulate_timeline(
    deadline_or_start_date: str | None,
    inputs: dict[str, int] | None = None,
    today: date | None = None,
) -> dict:
    """Compute timeline risk in the shared schema.

    Risk rules (keep in sync with the frontend):
      - no deadline           -> low
      - deadline passed/today -> high
      - need > have           -> high
      - slack <= 2 days       -> medium_high
      - slack <= 5 days       -> moderate
      - otherwise             -> low
    """
    inputs = {**DEFAULT_INPUTS, **(inputs or {})}
    today = today or date.today()

    days_needed = sum(inputs[key] for _, key in STEPS)
    days_available = days_until(deadline_or_start_date, today)
    critical_path = [label for label, _ in STEPS]

    base = {
        "deadline_or_start_date": deadline_or_start_date,
        "days_until_deadline": days_available,
        "estimated_verification_days": days_needed,
        "critical_path": critical_path,
    }

    if days_available is None:
        return {
            **base,
            "risk_level": "low",
            "recommendation": (
                "No deadline detected. You still should verify eligibility before "
                "applying, but timing is not the main risk."
            ),
        }

    slack = days_available - days_needed
    latest_ask = (today + timedelta(days=max(slack, 0))).strftime("%b %d")

    if days_available <= 0:
        risk, rec = "high", (
            "The deadline or start date has already arrived. Contact the organizer "
            "immediately to ask if late verification or applications are possible."
        )
    elif slack < 0:
        risk, rec = "high", (
            f"Verification needs about {days_needed} days but only {days_available} "
            "remain. Ask the organizer right now and flag the deadline in your message."
        )
    elif slack <= 2:
        risk, rec = "medium_high", (
            f"You have {days_available} days and verification may take {days_needed}. "
            "Ask the organizer today — verification may take almost the entire "
            "remaining time."
        )
    elif slack <= 5:
        risk, rec = "moderate", (
            f"You have {days_available} days and verification takes about "
            f"{days_needed}. Start verification by {latest_ask} to stay safe."
        )
    else:
        risk, rec = "low", (
            f"You have {days_available} days — enough time to verify (about "
            f"{days_needed} days). Still, ask early: {latest_ask} is your latest "
            "safe start."
        )

    return {**base, "risk_level": risk, "recommendation": rec}
