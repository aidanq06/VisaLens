# InternRadar storage layer.
# SQLite for the local MVP; the schema is written portably (TEXT timestamps,
# no SQLite-only types) so it can be lifted to Supabase Postgres later.

from __future__ import annotations

import os
import sqlite3
from typing import Any, Iterable, Optional

DB_PATH = os.getenv(
    "RADAR_DB_PATH",
    os.path.join(os.path.dirname(__file__), "..", "..", "radar.db"),
)

SCHEMA = """
CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    website TEXT,
    tier INTEGER DEFAULT 2,            -- 1 = dream target, 2 = good, 3 = long tail
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_sources (
    id INTEGER PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    source_type TEXT NOT NULL,         -- greenhouse | lever | ashby | github_list | custom
    identifier TEXT NOT NULL,          -- board token / org slug / owner/repo
    url TEXT,
    tier INTEGER DEFAULT 2,
    active INTEGER DEFAULT 1,
    reliability_score REAL DEFAULT 70, -- EMA of check successes
    freshness_score REAL DEFAULT 50,   -- how recently it yielded new postings
    priority_score REAL DEFAULT 50,
    consecutive_failures INTEGER DEFAULT 0,
    last_checked_at TEXT,
    last_success_at TEXT,
    last_new_posting_at TEXT,
    next_check_at TEXT,                -- dynamic schedule; NULL = due now
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(source_type, identifier)
);

CREATE TABLE IF NOT EXISTS source_discoveries (
    id INTEGER PRIMARY KEY,
    company_name TEXT,
    url TEXT UNIQUE NOT NULL,
    ats_type TEXT,
    identifier TEXT,
    role_title_hint TEXT,
    confidence REAL DEFAULT 0.5,
    discovered_via TEXT,               -- e.g. github_list:owner/repo
    status TEXT DEFAULT 'candidate',   -- candidate | verified | promoted | rejected
    created_at TEXT DEFAULT (datetime('now')),
    verified_at TEXT
);

CREATE TABLE IF NOT EXISTS source_checks (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES job_sources(id),
    checked_at TEXT DEFAULT (datetime('now')),
    ok INTEGER,
    status TEXT,
    postings_found INTEGER DEFAULT 0,
    new_postings INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error TEXT
);

CREATE TABLE IF NOT EXISTS raw_postings (
    id INTEGER PRIMARY KEY,
    source_id INTEGER REFERENCES job_sources(id),
    external_id TEXT,
    fingerprint TEXT,
    fetched_at TEXT DEFAULT (datetime('now')),
    payload TEXT,                      -- JSON as returned by the adapter
    UNIQUE(source_id, external_id)
);

CREATE TABLE IF NOT EXISTS opportunities (
    id INTEGER PRIMARY KEY,
    fingerprint TEXT UNIQUE NOT NULL,
    company_name TEXT,
    title TEXT,
    location TEXT,
    remote INTEGER DEFAULT 0,
    season TEXT,
    apply_url TEXT,
    source_id INTEGER REFERENCES job_sources(id),
    source_type TEXT,
    is_source_of_truth INTEGER DEFAULT 0,
    description TEXT,
    posted_at TEXT,
    first_seen_at TEXT DEFAULT (datetime('now')),
    last_seen_at TEXT DEFAULT (datetime('now')),
    fit_score REAL DEFAULT 0,
    freshness_score REAL DEFAULT 0,
    urgency_score REAL DEFAULT 0,
    visa_risk_score INTEGER,
    visa_risk_level TEXT,
    visa_analysis TEXT,                -- full VisaLensAnalysis JSON
    found_early INTEGER DEFAULT 0,     -- seen here before any public list
    status TEXT DEFAULT 'new',         -- new | saved | applied | hidden
    active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public_list_appearances (
    id INTEGER PRIMARY KEY,
    list_source_id INTEGER REFERENCES job_sources(id),
    company_name TEXT,
    title TEXT,
    url TEXT,
    seen_at TEXT DEFAULT (datetime('now')),
    matched_opportunity_id INTEGER REFERENCES opportunities(id),
    found_early INTEGER DEFAULT 0,
    UNIQUE(list_source_id, url)
);

CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY,
    opportunity_id INTEGER REFERENCES opportunities(id),
    level TEXT,                        -- red | yellow
    channel TEXT DEFAULT 'discord',
    sent_at TEXT DEFAULT (datetime('now')),
    ok INTEGER,
    payload TEXT,
    UNIQUE(opportunity_id, level)
);

CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY,
    opportunity_id INTEGER UNIQUE REFERENCES opportunities(id),
    status TEXT DEFAULT 'applied',     -- applied | interviewing | offer | rejected
    notes TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_opps_first_seen ON opportunities(first_seen_at);
CREATE INDEX IF NOT EXISTS idx_opps_urgency ON opportunities(urgency_score);
CREATE INDEX IF NOT EXISTS idx_checks_source ON source_checks(source_id, checked_at);
"""


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(os.path.abspath(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_conn()
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def rows_to_dicts(rows: Iterable[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]


def upsert_company(conn: sqlite3.Connection, name: str, website: Optional[str] = None,
                   tier: int = 2) -> int:
    conn.execute(
        "INSERT INTO companies(name, website, tier) VALUES (?, ?, ?) "
        "ON CONFLICT(name) DO UPDATE SET tier=excluded.tier",
        (name, website, tier),
    )
    row = conn.execute("SELECT id FROM companies WHERE name = ?", (name,)).fetchone()
    return int(row["id"])


def upsert_source(conn: sqlite3.Connection, company_id: Optional[int], source_type: str,
                  identifier: str, url: str, tier: int = 2) -> int:
    conn.execute(
        "INSERT INTO job_sources(company_id, source_type, identifier, url, tier) "
        "VALUES (?, ?, ?, ?, ?) "
        "ON CONFLICT(source_type, identifier) DO UPDATE SET url=excluded.url",
        (company_id, source_type, identifier, url, tier),
    )
    row = conn.execute(
        "SELECT id FROM job_sources WHERE source_type = ? AND identifier = ?",
        (source_type, identifier),
    ).fetchone()
    return int(row["id"])
