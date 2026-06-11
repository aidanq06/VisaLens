# Deterministic posting filters: is this an internship Anson would care about?

from __future__ import annotations

import hashlib
import re
from typing import Optional

from .profile import ROLE_KEYWORDS, SEASONS

_WS = re.compile(r"\s+")


def normalize(text: Optional[str]) -> str:
    return _WS.sub(" ", (text or "").strip().lower())


# Word-boundary matching so "intern" never matches "internal"/"international".
_INTERN_TITLE_RE = re.compile(
    r"\b(interns?|internships?|co-?op|coop|student|university|"
    r"early careers?|summer analyst|technology analyst)\b", re.I,
)
_INTERN_DESC_RE = re.compile(r"\b(internships?|co-?op)\b", re.I)


def is_internship(title: str, description: str = "") -> bool:
    if _INTERN_TITLE_RE.search(title or ""):
        return True
    # Description matches must be explicit to avoid full-time false positives.
    return bool(_INTERN_DESC_RE.search((description or "")[:600]))


_ROLE_RES = [re.compile(rf"\b{re.escape(kw)}\b", re.I) for kw in ROLE_KEYWORDS]


def is_relevant_role(title: str, description: str = "") -> bool:
    # Title-only: descriptions mention "backend"/"infrastructure" even for
    # sales and ops roles, which floods the radar with noise.
    t = title or ""
    return any(r.search(t) for r in _ROLE_RES)


def detect_season(title: str, description: str = "") -> Optional[str]:
    haystack = f"{normalize(title)} {normalize(description)[:1500]}"
    for season in SEASONS:
        if season in haystack:
            return season.title()
    return None


def fingerprint(company: str, title: str, location: str) -> str:
    key = f"{normalize(company)}|{normalize(title)}|{normalize(location)}"
    return hashlib.sha1(key.encode()).hexdigest()


def strip_html(html: Optional[str]) -> str:
    if not html:
        return ""
    import html as html_mod

    text = html_mod.unescape(html)
    text = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<br\s*/?>|</p>|</li>|</div>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return _WS.sub(" ", text).strip()
