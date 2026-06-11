# Deterministic opportunity scoring: freshness, Anson fit, urgency.
# Every score is explainable — reasons are returned alongside the numbers.

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Optional

from .filters import normalize
from .profile import (
    HIGH_FIT_TITLE_KEYWORDS,
    PENALTY_PATTERNS,
    SKILL_KEYWORDS,
)

SOURCE_OF_TRUTH_TYPES = {"greenhouse", "lever", "ashby", "custom"}


def _hours_since(iso_ts: Optional[str]) -> float:
    if not iso_ts:
        return 9999.0
    try:
        ts = datetime.fromisoformat(iso_ts.replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return max(0.0, (datetime.now(timezone.utc) - ts).total_seconds() / 3600)
    except ValueError:
        return 9999.0


def freshness_score(first_seen_at: Optional[str]) -> float:
    """Heavily favor roles found within the last 1 / 6 / 24 hours."""
    hours = _hours_since(first_seen_at)
    if hours <= 1:
        return 100
    if hours <= 6:
        return 90
    if hours <= 24:
        return 75
    if hours <= 72:
        return 50
    if hours <= 168:
        return 30
    return 10


def fit_score(title: str, description: str = "") -> tuple[float, list[str]]:
    t = normalize(title)
    d = normalize(description)
    score = 30.0  # passed the internship+role filters to get here
    reasons: list[str] = []

    title_hits = [kw for kw in HIGH_FIT_TITLE_KEYWORDS if kw in t]
    if title_hits:
        score += min(35, 15 + 5 * len(title_hits))
        reasons.append(f"title matches: {', '.join(title_hits[:4])}")

    skill_hits = [kw for kw in SKILL_KEYWORDS if kw in d]
    if skill_hits:
        score += min(25, 3 * len(skill_hits))
        reasons.append(f"stack overlap: {', '.join(skill_hits[:6])}")

    for pattern, penalty, label in PENALTY_PATTERNS:
        if re.search(pattern, t) or re.search(pattern, d[:1500]):
            # An explicit intern title outweighs ambiguous penalty language.
            if "intern" in t and label in {"new-grad-only role", "PhD required"}:
                continue
            score -= penalty
            reasons.append(f"penalty: {label}")

    return max(0.0, min(100.0, score)), reasons


def urgency_score(
    freshness: float,
    fit: float,
    source_type: str,
    season: Optional[str],
) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.45 * freshness + 0.40 * fit

    if source_type in SOURCE_OF_TRUTH_TYPES:
        score += 12
        reasons.append("direct source-of-truth posting")

    if season and any(s in season.lower() for s in ("2026", "2027", "co-op")):
        score += 6
        reasons.append(f"target season: {season}")

    return max(0.0, min(100.0, score)), reasons


def score_opportunity(opp: dict[str, Any]) -> dict[str, Any]:
    """Compute all three scores for a normalized opportunity dict."""
    fresh = freshness_score(opp.get("first_seen_at"))
    fit, fit_reasons = fit_score(opp.get("title") or "", opp.get("description") or "")
    urgency, urgency_reasons = urgency_score(
        fresh, fit, opp.get("source_type") or "", opp.get("season")
    )
    return {
        "freshness_score": round(fresh, 1),
        "fit_score": round(fit, 1),
        "urgency_score": round(urgency, 1),
        "score_reasons": fit_reasons + urgency_reasons,
    }
