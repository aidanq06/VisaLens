# Critical path helpers for the verification workflow.

from __future__ import annotations

from .timeline_simulator import DEFAULT_INPUTS, STEPS


def critical_path(inputs: dict[str, int] | None = None) -> list[dict]:
    """Ordered verification steps with day estimates and owners."""
    inputs = {**DEFAULT_INPUTS, **(inputs or {})}
    owners = {
        "Organizer response": "organizer",
        "Advisor/DSO clarification": "advisor",
        "Student decision": "student",
    }
    return [
        {"label": label, "days": inputs[key], "owner": owners[label]}
        for label, key in STEPS
    ]


def find_bottleneck(steps: list[dict]) -> dict:
    """The step with the largest day estimate (earlier step wins ties)."""
    return max(steps, key=lambda s: s["days"]) if steps else {}
