# Seed companies and sources.
# Board tokens are public job-board identifiers. A token that stops resolving
# just lowers that source's reliability — the health system retires it.

from __future__ import annotations

from .db import get_conn, init_db, upsert_company, upsert_source

# (company, ats_type, identifier, tier)
SEED_SOURCES = [
    # Greenhouse boards
    ("Stripe", "greenhouse", "stripe", 1),
    ("Datadog", "greenhouse", "datadog", 1),
    ("Dropbox", "greenhouse", "dropbox", 2),
    ("Duolingo", "greenhouse", "duolingo", 1),
    ("Gusto", "greenhouse", "gusto", 2),
    ("Robinhood", "greenhouse", "robinhood", 2),
    ("Asana", "greenhouse", "asana", 2),
    ("Scale AI", "greenhouse", "scaleai", 1),
    ("Anthropic", "greenhouse", "anthropic", 1),
    ("Figma", "greenhouse", "figma", 1),
    ("Cloudflare", "greenhouse", "cloudflare", 1),
    ("MongoDB", "greenhouse", "mongodb", 2),
    # Lever boards
    ("Palantir", "lever", "palantir", 1),
    ("Plaid", "lever", "plaid", 2),
    ("Zoox", "lever", "zoox", 2),
    ("Voleon", "lever", "voleon", 3),
    # Ashby boards
    ("OpenAI", "ashby", "openai", 1),
    ("Ramp", "ashby", "ramp", 1),
    ("Linear", "ashby", "linear", 2),
    ("Notion", "ashby", "notion", 1),
    ("Replit", "ashby", "replit", 2),
    ("Cursor", "ashby", "cursor", 1),
]

# Public GitHub internship lists ("owner/repo"). Also feed source discovery.
SEED_GITHUB_LISTS = [
    "SimplifyJobs/Summer2026-Internships",
    "SimplifyJobs/Summer2027-Internships",
    "vanshb03/Summer2026-Internships",
]

_SOURCE_URLS = {
    "greenhouse": "https://boards.greenhouse.io/{id}",
    "lever": "https://jobs.lever.co/{id}",
    "ashby": "https://jobs.ashbyhq.com/{id}",
}


def seed() -> dict:
    init_db()
    conn = get_conn()
    try:
        n_sources = 0
        for company, ats, identifier, tier in SEED_SOURCES:
            company_id = upsert_company(conn, company, tier=tier)
            upsert_source(
                conn, company_id, ats, identifier,
                _SOURCE_URLS[ats].format(id=identifier), tier=tier,
            )
            n_sources += 1
        for repo in SEED_GITHUB_LISTS:
            upsert_source(
                conn, None, "github_list", repo,
                f"https://github.com/{repo}", tier=2,
            )
            n_sources += 1
        conn.commit()
        return {"companies": len(SEED_SOURCES), "sources": n_sources}
    finally:
        conn.close()
