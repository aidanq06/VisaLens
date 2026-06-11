# Scan orchestrator: checks due sources, normalizes and dedupes postings,
# scores them, runs the VisaLens eligibility pipeline on new opportunities,
# updates source health, and fires Discord alerts.

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from ..analysis.pipeline import run_analysis
from .adapters import detect_ats, fetch_source
from .alerts import alert_level, build_alert_payload, send_discord_alert
from .db import get_conn, init_db
from .filters import detect_season, fingerprint, is_internship, is_relevant_role
from .scoring import SOURCE_OF_TRUTH_TYPES, score_opportunity

logger = logging.getLogger(__name__)

MAX_ALERTS_PER_SCAN = 15

# Base check interval in hours, before backoff. Mirrors the dynamic
# scheduling tiers: hot targets hourly-ish, lists every few hours,
# everything else daily-ish, stale sources weekly.
def _base_interval_hours(source: dict[str, Any]) -> float:
    if source["source_type"] == "github_list":
        return 4
    if source["tier"] == 1:
        return 2
    if source["source_type"] in SOURCE_OF_TRUTH_TYPES:
        return 8 if source["tier"] == 2 else 24
    return 24


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _analyze_visa(title: str, description: str) -> dict[str, Any]:
    """Run the deterministic VisaLens pipeline (no LLM unless HF token set)."""
    text = description.strip() or title
    return run_analysis(
        title=title, text=text,
        student_status="F-1", opportunity_type_hint="internship",
    )


def _insert_opportunity(
    conn, posting: dict[str, Any], source: dict[str, Any]
) -> Optional[dict[str, Any]]:
    """Create or refresh an opportunity. Returns the dict only when new."""
    company = posting.get("company_name") or source.get("company_name") or ""
    title = posting["title"]
    location = posting.get("location") or ""
    fp = fingerprint(company, title, location)

    existing = conn.execute(
        "SELECT id FROM opportunities WHERE fingerprint = ?", (fp,)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE opportunities SET last_seen_at = ? WHERE id = ?",
            (_now(), existing["id"]),
        )
        return None

    description = posting.get("description") or ""
    season = detect_season(title, description)
    opp = {
        "fingerprint": fp,
        "company_name": company,
        "title": title,
        "location": location,
        "remote": posting.get("remote", 0),
        "season": season,
        "apply_url": posting.get("apply_url") or "",
        "source_id": source["id"],
        "source_type": source["source_type"],
        "is_source_of_truth": 1 if source["source_type"] in SOURCE_OF_TRUTH_TYPES else 0,
        "description": description[:8000],
        "posted_at": posting.get("posted_at"),
        "first_seen_at": _now(),
        "last_seen_at": _now(),
    }
    opp.update(score_opportunity(opp))

    analysis = _analyze_visa(title, description)
    opp["visa_risk_score"] = analysis["risk"]["score"]
    opp["visa_risk_level"] = analysis["risk"]["level"]

    cursor = conn.execute(
        """INSERT INTO opportunities
           (fingerprint, company_name, title, location, remote, season, apply_url,
            source_id, source_type, is_source_of_truth, description, posted_at,
            first_seen_at, last_seen_at, fit_score, freshness_score, urgency_score,
            visa_risk_score, visa_risk_level, visa_analysis)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            opp["fingerprint"], opp["company_name"], opp["title"], opp["location"],
            opp["remote"], opp["season"], opp["apply_url"], opp["source_id"],
            opp["source_type"], opp["is_source_of_truth"], opp["description"],
            opp["posted_at"], opp["first_seen_at"], opp["last_seen_at"],
            opp["fit_score"], opp["freshness_score"], opp["urgency_score"],
            opp["visa_risk_score"], opp["visa_risk_level"], json.dumps(analysis),
        ),
    )
    opp["id"] = cursor.lastrowid
    return opp


def _maybe_alert(conn, opp: dict[str, Any], alerts_sent: int) -> int:
    level = alert_level(opp["urgency_score"])
    if level is None or alerts_sent >= MAX_ALERTS_PER_SCAN:
        return alerts_sent
    inserted = conn.execute(
        "INSERT OR IGNORE INTO alerts(opportunity_id, level, ok, payload) "
        "VALUES (?, ?, 0, ?)",
        (opp["id"], level, json.dumps(build_alert_payload(opp, level))),
    )
    if inserted.rowcount == 0:
        return alerts_sent
    ok = send_discord_alert(opp, level)
    conn.execute(
        "UPDATE alerts SET ok = ? WHERE opportunity_id = ? AND level = ?",
        (1 if ok else 0, opp["id"], level),
    )
    return alerts_sent + 1


def _record_list_appearance(conn, source: dict[str, Any], posting: dict[str, Any]) -> None:
    """Track public-list sightings and flag opportunities we found first."""
    match = conn.execute(
        "SELECT id, first_seen_at, source_type FROM opportunities "
        "WHERE lower(company_name) = lower(?) AND lower(title) = lower(?) "
        "AND source_type != 'github_list' LIMIT 1",
        (posting.get("company_name") or "", posting["title"]),
    ).fetchone()
    found_early = 1 if match else 0
    conn.execute(
        "INSERT OR IGNORE INTO public_list_appearances "
        "(list_source_id, company_name, title, url, matched_opportunity_id, found_early) "
        "VALUES (?,?,?,?,?,?)",
        (source["id"], posting.get("company_name"), posting["title"],
         posting.get("apply_url"), match["id"] if match else None, found_early),
    )
    if match:
        conn.execute(
            "UPDATE opportunities SET found_early = 1 WHERE id = ?", (match["id"],)
        )


def _record_discovery(conn, source: dict[str, Any], posting: dict[str, Any]) -> None:
    """Feed the self-healing source graph from links found in public lists."""
    url = posting.get("apply_url") or ""
    detected = detect_ats(url)
    if not detected:
        return
    ats_type, identifier = detected
    already = conn.execute(
        "SELECT 1 FROM job_sources WHERE source_type = ? AND identifier = ?",
        (ats_type, identifier),
    ).fetchone()
    if already:
        return
    conn.execute(
        "INSERT OR IGNORE INTO source_discoveries "
        "(company_name, url, ats_type, identifier, role_title_hint, confidence, discovered_via) "
        "VALUES (?,?,?,?,?,?,?)",
        (posting.get("company_name"), url, ats_type, identifier,
         posting["title"], 0.8, f"github_list:{source['identifier']}"),
    )


def _update_health(conn, source: dict[str, Any], ok: bool, new_postings: int) -> None:
    reliability = 0.8 * source["reliability_score"] + 0.2 * (100 if ok else 0)
    failures = 0 if ok else source["consecutive_failures"] + 1

    last_new = source["last_new_posting_at"]
    if new_postings > 0:
        last_new = _now()
    if last_new:
        age_h = (datetime.now(timezone.utc)
                 - datetime.fromisoformat(last_new).replace(tzinfo=timezone.utc)
                 ).total_seconds() / 3600
        freshness = max(5.0, 100 - age_h / 3)   # decays ~1pt per 3h without news
    else:
        freshness = 30.0

    priority = 0.5 * reliability + 0.3 * freshness + 0.2 * (100 if source["tier"] == 1 else 50)

    interval = _base_interval_hours(source) * (2 ** min(failures, 5))
    interval = min(interval, 168)  # never slower than weekly
    if reliability < 20 and failures >= 5:
        conn.execute("UPDATE job_sources SET active = 0 WHERE id = ?", (source["id"],))

    next_check = (datetime.now(timezone.utc) + timedelta(hours=interval)).strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    conn.execute(
        """UPDATE job_sources SET reliability_score=?, freshness_score=?, priority_score=?,
           consecutive_failures=?, last_checked_at=?, next_check_at=?,
           last_success_at=COALESCE(?, last_success_at),
           last_new_posting_at=COALESCE(?, last_new_posting_at)
           WHERE id=?""",
        (round(reliability, 1), round(freshness, 1), round(priority, 1),
         failures, _now(), next_check,
         _now() if ok else None,
         _now() if new_postings > 0 else None,
         source["id"]),
    )


def check_source(conn, source: dict[str, Any]) -> dict[str, Any]:
    started = time.time()
    is_first_import = source["last_success_at"] is None
    new_count, found_count, alerts_sent = 0, 0, 0
    error = None

    try:
        postings = fetch_source(source["source_type"], source["identifier"])
        found_count = len(postings)
        for posting in postings:
            if not posting.get("company_name"):
                posting["company_name"] = source.get("company_name")
            if not (is_internship(posting["title"], posting.get("description") or "")
                    and is_relevant_role(posting["title"], posting.get("description") or "")):
                continue
            conn.execute(
                "INSERT INTO raw_postings(source_id, external_id, fingerprint, payload) "
                "VALUES (?,?,?,?) ON CONFLICT(source_id, external_id) "
                "DO UPDATE SET fetched_at=datetime('now')",
                (source["id"], posting["external_id"],
                 fingerprint(posting.get("company_name") or "", posting["title"],
                             posting.get("location") or ""),
                 json.dumps(posting)[:20000]),
            )
            if source["source_type"] == "github_list":
                _record_list_appearance(conn, source, posting)
                _record_discovery(conn, source, posting)

            opp = _insert_opportunity(conn, posting, source)
            if opp:
                new_count += 1
                # First import of a source is baseline data, not breaking news.
                if not is_first_import:
                    alerts_sent = _maybe_alert(conn, opp, alerts_sent)
        ok = True
    except Exception as exc:  # network errors, 404 boards, parse failures
        ok = False
        error = str(exc)[:500]
        logger.warning("source %s/%s failed: %s",
                       source["source_type"], source["identifier"], error)

    conn.execute(
        "INSERT INTO source_checks(source_id, ok, status, postings_found, "
        "new_postings, duration_ms, error) VALUES (?,?,?,?,?,?,?)",
        (source["id"], 1 if ok else 0, "ok" if ok else "error",
         found_count, new_count, int((time.time() - started) * 1000), error),
    )
    _update_health(conn, source, ok, new_count)
    conn.commit()
    return {"source": f"{source['source_type']}/{source['identifier']}",
            "ok": ok, "found": found_count, "new": new_count,
            "alerts": alerts_sent, "error": error}


def scan(force_all: bool = False, limit: Optional[int] = None) -> list[dict[str, Any]]:
    """Check all due sources (or everything with force_all)."""
    init_db()
    conn = get_conn()
    try:
        where = "active = 1" if force_all else (
            "active = 1 AND (next_check_at IS NULL OR next_check_at <= datetime('now'))"
        )
        rows = conn.execute(
            f"""SELECT s.*, c.name AS company_name FROM job_sources s
                LEFT JOIN companies c ON c.id = s.company_id
                WHERE {where} ORDER BY s.priority_score DESC"""
        ).fetchall()
        sources = [dict(r) for r in rows]
        if limit:
            sources = sources[:limit]

        results = []
        for source in sources:
            results.append(check_source(conn, source))
            time.sleep(0.4)  # politeness between external calls
        return results
    finally:
        conn.close()


def verify_discoveries(limit: int = 10) -> list[dict[str, Any]]:
    """Verify candidate sources by hitting their ATS API; promote ones that work."""
    init_db()
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM source_discoveries WHERE status = 'candidate' "
            "ORDER BY confidence DESC LIMIT ?", (limit,)
        ).fetchall()
        results = []
        for cand in [dict(r) for r in rows]:
            try:
                postings = fetch_source(cand["ats_type"], cand["identifier"])
                from .db import upsert_company, upsert_source

                company_id = (
                    upsert_company(conn, cand["company_name"], tier=2)
                    if cand["company_name"] else None
                )
                upsert_source(conn, company_id, cand["ats_type"],
                              cand["identifier"], cand["url"], tier=2)
                conn.execute(
                    "UPDATE source_discoveries SET status='promoted', "
                    "verified_at=datetime('now') WHERE id=?", (cand["id"],),
                )
                results.append({"identifier": cand["identifier"],
                                "ats": cand["ats_type"], "status": "promoted",
                                "postings": len(postings)})
            except Exception as exc:
                conn.execute(
                    "UPDATE source_discoveries SET status='rejected', "
                    "verified_at=datetime('now') WHERE id=?", (cand["id"],),
                )
                results.append({"identifier": cand["identifier"],
                                "ats": cand["ats_type"], "status": "rejected",
                                "error": str(exc)[:200]})
            conn.commit()
            time.sleep(0.4)
        return results
    finally:
        conn.close()
