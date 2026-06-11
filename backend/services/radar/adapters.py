# Source adapters. Each takes a job_sources row and returns normalized
# posting dicts:
#   {external_id, company_name, title, location, remote, apply_url,
#    description, posted_at}
#
# Only public, unauthenticated, structured endpoints are used — the official
# Greenhouse/Lever/Ashby job-board APIs and raw GitHub READMEs. No HTML
# scraping of login-gated or bot-protected pages.

from __future__ import annotations

import json
import re
from typing import Any, Optional

import requests

from .filters import strip_html

HEADERS = {"User-Agent": "InternRadar-Personal/0.1 (personal internship tracker)"}
TIMEOUT = 20


def _get_json(url: str) -> Any:
    resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


# ── Greenhouse ───────────────────────────────────────────────────────────
def fetch_greenhouse(identifier: str) -> list[dict[str, Any]]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{identifier}/jobs?content=true"
    data = _get_json(url)
    postings = []
    for job in data.get("jobs", []):
        postings.append({
            "external_id": str(job.get("id")),
            "company_name": None,  # filled from the source's company
            "title": job.get("title") or "",
            "location": (job.get("location") or {}).get("name") or "",
            "remote": 1 if "remote" in ((job.get("location") or {}).get("name") or "").lower() else 0,
            "apply_url": job.get("absolute_url") or "",
            "description": strip_html(job.get("content"))[:8000],
            "posted_at": job.get("first_published") or job.get("updated_at"),
        })
    return postings


# ── Lever ────────────────────────────────────────────────────────────────
def fetch_lever(identifier: str) -> list[dict[str, Any]]:
    url = f"https://api.lever.co/v0/postings/{identifier}?mode=json"
    data = _get_json(url)
    postings = []
    for job in data if isinstance(data, list) else []:
        loc = (job.get("categories") or {}).get("location") or ""
        created_ms = job.get("createdAt")
        posted_at = None
        if isinstance(created_ms, (int, float)):
            from datetime import datetime, timezone

            posted_at = datetime.fromtimestamp(created_ms / 1000, tz=timezone.utc).isoformat()
        postings.append({
            "external_id": str(job.get("id")),
            "company_name": None,
            "title": job.get("text") or "",
            "location": loc,
            "remote": 1 if "remote" in loc.lower() else 0,
            "apply_url": job.get("hostedUrl") or job.get("applyUrl") or "",
            "description": (job.get("descriptionPlain") or strip_html(job.get("description")))[:8000],
            "posted_at": posted_at,
        })
    return postings


# ── Ashby ────────────────────────────────────────────────────────────────
def fetch_ashby(identifier: str) -> list[dict[str, Any]]:
    url = f"https://api.ashbyhq.com/posting-api/job-board/{identifier}"
    data = _get_json(url)
    postings = []
    for job in data.get("jobs", []):
        loc = job.get("location") or ""
        postings.append({
            "external_id": str(job.get("id")),
            "company_name": None,
            "title": job.get("title") or "",
            "location": loc,
            "remote": 1 if job.get("isRemote") or "remote" in loc.lower() else 0,
            "apply_url": job.get("jobUrl") or job.get("applyUrl") or "",
            "description": strip_html(job.get("descriptionHtml"))[:8000],
            "posted_at": job.get("publishedAt"),
        })
    return postings


# ── GitHub public internship lists ───────────────────────────────────────
# identifier is "owner/repo". Parses markdown table rows from the README.
_MD_LINK = re.compile(r"\[([^\]]*)\]\((https?://[^\s)]+)\)")
_HTML_LINK = re.compile(r'href="(https?://[^"]+)"')


def fetch_github_list(identifier: str) -> list[dict[str, Any]]:
    readme = None
    for branch in ("main", "master", "dev"):
        url = f"https://raw.githubusercontent.com/{identifier}/{branch}/README.md"
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if resp.status_code == 200:
            readme = resp.text
            break
    if readme is None:
        raise RuntimeError(f"README not found for {identifier}")

    postings = _parse_markdown_table(readme)
    postings += _parse_html_table(readme)
    return postings


_TR = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
_TD = re.compile(r"<td[^>]*>(.*?)</td>", re.S | re.I)
_AGE = re.compile(r"^(\d+)\s*(d|h|mo)$", re.I)


def _parse_html_table(readme: str) -> list[dict[str, Any]]:
    """Parse HTML <table> rows (SimplifyJobs list format)."""
    from datetime import datetime, timedelta, timezone

    postings = []
    last_company = ""
    for row_html in _TR.findall(readme):
        cells = _TD.findall(row_html)
        if len(cells) < 4:
            continue
        company = strip_html(cells[0]).strip()
        if company in {"", "↳"}:
            company = last_company
        else:
            last_company = company
        title = strip_html(cells[1]).strip()
        location = strip_html(re.sub(r"<br\s*/?>", ", ", cells[2])).strip()[:120]

        link = None
        for href in _HTML_LINK.findall(cells[3]):
            if "simplify.jobs" not in href:
                link = href
                break
            link = link or href
        if not company or not title or not link:
            continue

        posted_at = None
        if len(cells) >= 5:
            m = _AGE.match(strip_html(cells[4]).strip())
            if m:
                amount, unit = int(m.group(1)), m.group(2).lower()
                delta = {"h": timedelta(hours=amount), "d": timedelta(days=amount),
                         "mo": timedelta(days=30 * amount)}[unit]
                posted_at = (datetime.now(timezone.utc) - delta).isoformat()

        postings.append({
            "external_id": link,
            "company_name": company,
            "title": title,
            "location": location,
            "remote": 1 if "remote" in location.lower() else 0,
            "apply_url": link,
            "description": "",
            "posted_at": posted_at,
        })
    return postings


def _parse_markdown_table(readme: str) -> list[dict[str, Any]]:
    postings = []
    last_company = ""
    for line in readme.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3 or set(cells[0]) <= {"-", " ", ":"}:
            continue  # separator or malformed row

        company_cell, title_cell = cells[0], cells[1]
        location_cell = cells[2] if len(cells) > 2 else ""

        company = re.sub(r"\*+", "", _MD_LINK.sub(r"\1", company_cell)).strip()
        # Lists use ↳ / arrows for repeated company rows
        if company in {"", "↳", "->", "—"}:
            company = last_company
        else:
            last_company = company

        title = _MD_LINK.sub(r"\1", title_cell).strip()
        if not company or not title or company.lower() == "company":
            continue

        link = None
        for cell in cells:
            m = _MD_LINK.search(cell) or _HTML_LINK.search(cell)
            if m:
                candidate = m.group(2) if m.re is _MD_LINK else m.group(1)
                if "simplify.jobs" not in candidate:
                    link = candidate
                    break
                link = link or candidate
        if not link:
            continue

        postings.append({
            "external_id": link,
            "company_name": company,
            "title": title,
            "location": strip_html(_MD_LINK.sub(r"\1", location_cell))[:120],
            "remote": 1 if "remote" in location_cell.lower() else 0,
            "apply_url": link,
            "description": "",
            "posted_at": None,
        })
    return postings


ADAPTERS = {
    "greenhouse": fetch_greenhouse,
    "lever": fetch_lever,
    "ashby": fetch_ashby,
    "github_list": fetch_github_list,
}


def fetch_source(source_type: str, identifier: str) -> list[dict[str, Any]]:
    adapter = ADAPTERS.get(source_type)
    if adapter is None:
        raise ValueError(f"No adapter for source type: {source_type}")
    return adapter(identifier)


# ── ATS URL detection (used by discovery) ────────────────────────────────
_ATS_PATTERNS = [
    ("greenhouse", re.compile(r"(?:boards|job-boards)\.greenhouse\.io/(?:embed/job_board\?for=)?([A-Za-z0-9_-]+)")),
    ("lever", re.compile(r"jobs\.lever\.co/([A-Za-z0-9_-]+)")),
    ("ashby", re.compile(r"jobs\.ashbyhq\.com/([A-Za-z0-9_%-]+)")),
]


def detect_ats(url: str) -> Optional[tuple[str, str]]:
    """Return (ats_type, identifier) if the URL points at a supported ATS."""
    for ats_type, pattern in _ATS_PATTERNS:
        m = pattern.search(url)
        if m:
            return ats_type, m.group(1)
    return None
