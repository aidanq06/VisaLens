# Discord webhook alerts.
# Red alert: urgency >= 85. Yellow alert: urgency >= 70.
# Set DISCORD_WEBHOOK_URL in backend/.env; alerts are skipped silently if unset.

from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

RED_THRESHOLD = 85
YELLOW_THRESHOLD = 70

_COLORS = {"red": 0xEF4343, "yellow": 0xF5A623}


def alert_level(urgency: float) -> Optional[str]:
    if urgency >= RED_THRESHOLD:
        return "red"
    if urgency >= YELLOW_THRESHOLD:
        return "yellow"
    return None


def build_alert_payload(opp: dict[str, Any], level: str) -> dict[str, Any]:
    reasons = opp.get("score_reasons") or []
    fields = [
        {"name": "Location", "value": opp.get("location") or "—", "inline": True},
        {"name": "Source", "value": opp.get("source_type") or "—", "inline": True},
        {"name": "First seen", "value": opp.get("first_seen_at") or "—", "inline": True},
        {"name": "Fit score", "value": str(opp.get("fit_score")), "inline": True},
        {"name": "Urgency", "value": str(opp.get("urgency_score")), "inline": True},
        {
            "name": "Visa risk",
            "value": f"{opp.get('visa_risk_score', '—')} ({opp.get('visa_risk_level', 'n/a')})",
            "inline": True,
        },
    ]
    if reasons:
        fields.append({"name": "Why", "value": "; ".join(reasons)[:1000], "inline": False})
    return {
        "embeds": [{
            "title": f"{'🔴' if level == 'red' else '🟡'} {opp.get('company_name')}: {opp.get('title')}"[:250],
            "url": opp.get("apply_url") or None,
            "color": _COLORS[level],
            "fields": fields,
            "footer": {"text": "InternRadar · VisaLens"},
        }]
    }


def send_discord_alert(opp: dict[str, Any], level: str) -> bool:
    webhook = os.getenv("DISCORD_WEBHOOK_URL")
    payload = build_alert_payload(opp, level)
    if not webhook:
        logger.info("DISCORD_WEBHOOK_URL unset; skipping %s alert for %s",
                    level, opp.get("title"))
        return False
    try:
        resp = requests.post(webhook, json=payload, timeout=10)
        return resp.status_code in (200, 204)
    except requests.RequestException as exc:
        logger.warning("Discord alert failed: %s", exc)
        return False
