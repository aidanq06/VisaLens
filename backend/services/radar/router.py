# FastAPI routes for InternRadar, mounted under /api/radar.

from __future__ import annotations

import json
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .action_queue import build_action_queue
from .db import get_conn, init_db, rows_to_dicts
from .scanner import scan, verify_discoveries
from .seeds import seed

router = APIRouter(prefix="/api/radar", tags=["radar"])

_VIEW_FILTERS = {
    "apply_now": "active = 1 AND status != 'hidden' AND urgency_score >= 70",
    "found_today": "active = 1 AND status != 'hidden' "
                   "AND first_seen_at >= datetime('now', '-1 day')",
    "source_of_truth": "active = 1 AND status != 'hidden' AND is_source_of_truth = 1",
    "all": "active = 1 AND status != 'hidden'",
}


@router.post("/seed")
def seed_endpoint() -> dict:
    return seed()


@router.post("/scan")
def scan_endpoint(force_all: bool = False, limit: Optional[int] = None) -> dict:
    results = scan(force_all=force_all, limit=limit)
    return {
        "checked": len(results),
        "new_opportunities": sum(r["new"] for r in results),
        "failures": [r for r in results if not r["ok"]],
        "results": results,
    }


@router.post("/discover")
def discover_endpoint(limit: int = 10) -> dict:
    results = verify_discoveries(limit=limit)
    return {"verified": results}


@router.get("/opportunities")
def opportunities(view: str = "all", limit: int = 100) -> list[dict[str, Any]]:
    where = _VIEW_FILTERS.get(view)
    if where is None:
        raise HTTPException(400, f"Unknown view: {view}")
    init_db()
    conn = get_conn()
    try:
        rows = conn.execute(
            f"""SELECT id, company_name, title, location, remote, season, apply_url,
                       source_type, is_source_of_truth, posted_at, first_seen_at,
                       fit_score, freshness_score, urgency_score,
                       visa_risk_score, visa_risk_level, found_early, status
                FROM opportunities WHERE {where}
                ORDER BY urgency_score DESC, first_seen_at DESC LIMIT ?""",
            (min(limit, 500),),
        ).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


@router.get("/opportunities/{opp_id}/analysis")
def opportunity_analysis(opp_id: int) -> dict[str, Any]:
    init_db()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT visa_analysis FROM opportunities WHERE id = ?", (opp_id,)
        ).fetchone()
        if row is None or not row["visa_analysis"]:
            raise HTTPException(404, "No analysis stored for this opportunity")
        return json.loads(row["visa_analysis"])
    finally:
        conn.close()


class StatusUpdate(BaseModel):
    status: str  # new | saved | applied | hidden


@router.patch("/opportunities/{opp_id}/status")
def update_status(opp_id: int, body: StatusUpdate) -> dict:
    if body.status not in {"new", "saved", "applied", "hidden"}:
        raise HTTPException(400, "Invalid status")
    init_db()
    conn = get_conn()
    try:
        updated = conn.execute(
            "UPDATE opportunities SET status = ? WHERE id = ?",
            (body.status, opp_id),
        )
        if updated.rowcount == 0:
            raise HTTPException(404, "Opportunity not found")
        if body.status == "applied":
            conn.execute(
                "INSERT INTO applications(opportunity_id, status) VALUES (?, 'applied') "
                "ON CONFLICT(opportunity_id) DO UPDATE SET "
                "status='applied', updated_at=datetime('now')",
                (opp_id,),
            )
        conn.commit()
        return {"id": opp_id, "status": body.status}
    finally:
        conn.close()


@router.get("/action-queue")
def action_queue(limit: int = 300) -> dict[str, Any]:
    """Daily decision queue: every tracked role classified into a
    deterministic action (apply now / verify first / ask advisor /
    likely blocked / watch / low priority) with reasons and next steps."""
    return build_action_queue(limit=limit)


@router.get("/sources")
def sources() -> list[dict[str, Any]]:
    init_db()
    conn = get_conn()
    try:
        rows = conn.execute(
            """SELECT s.id, c.name AS company_name, s.source_type, s.identifier,
                      s.url, s.tier, s.active, s.reliability_score,
                      s.freshness_score, s.priority_score, s.consecutive_failures,
                      s.last_checked_at, s.last_new_posting_at, s.next_check_at,
                      (SELECT COUNT(*) FROM opportunities o
                        WHERE o.source_id = s.id AND o.active = 1) AS opportunity_count
               FROM job_sources s LEFT JOIN companies c ON c.id = s.company_id
               ORDER BY s.active DESC, s.priority_score DESC"""
        ).fetchall()
        return rows_to_dicts(rows)
    finally:
        conn.close()


@router.get("/stats")
def stats() -> dict[str, Any]:
    init_db()
    conn = get_conn()
    try:
        def one(sql: str) -> int:
            return int(conn.execute(sql).fetchone()[0])

        return {
            "opportunities": one("SELECT COUNT(*) FROM opportunities WHERE active = 1"),
            "found_today": one("SELECT COUNT(*) FROM opportunities "
                               "WHERE first_seen_at >= datetime('now','-1 day')"),
            "apply_now": one("SELECT COUNT(*) FROM opportunities "
                             "WHERE active = 1 AND urgency_score >= 70"),
            "source_of_truth": one("SELECT COUNT(*) FROM opportunities "
                                   "WHERE active = 1 AND is_source_of_truth = 1"),
            "found_early": one("SELECT COUNT(*) FROM opportunities WHERE found_early = 1"),
            "active_sources": one("SELECT COUNT(*) FROM job_sources WHERE active = 1"),
            "pending_discoveries": one("SELECT COUNT(*) FROM source_discoveries "
                                       "WHERE status = 'candidate'"),
            "alerts_sent": one("SELECT COUNT(*) FROM alerts"),
        }
    finally:
        conn.close()
