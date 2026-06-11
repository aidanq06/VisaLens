# Anson's target profile — all matching is deterministic keyword scoring.
# Tweak these lists to retune the radar; no model calls involved.

from __future__ import annotations

# A posting must hit at least one of these to count as an internship.
INTERNSHIP_KEYWORDS = [
    "intern", "internship", "co-op", "coop", "co op", "student",
    "university", "early career", "early careers", "summer analyst",
    "technology analyst",
]

# And at least one of these to count as a relevant role.
ROLE_KEYWORDS = [
    "software engineer", "software engineering", "swe", "backend",
    "back-end", "frontend", "front-end", "full stack", "fullstack",
    "ai engineer", "machine learning", "ml engineer", "applied ai",
    "data science", "research engineer", "computer engineering",
    "embedded software", "embedded", "firmware", "systems software",
    "platform engineering", "platform engineer", "infrastructure",
    "cloud engineering", "cloud engineer", "security engineering",
    "security engineer", "robotics software", "hardware software",
    "developer", "software developer",
]

# Title hits on these add the strongest fit boost.
HIGH_FIT_TITLE_KEYWORDS = [
    "software engineer", "swe", "backend", "ai", "machine learning",
    "ml", "systems", "embedded", "firmware", "infrastructure",
    "platform", "computer engineering",
]

# Description skill matches, +3 each (capped) — mirrors Anson's stack.
SKILL_KEYWORDS = [
    "python", "typescript", "react", "next.js", "nextjs", "supabase",
    "postgres", "postgresql", "fastapi", "llm", "llms", "agents",
    "agentic", "machine learning", "backend", "systems", "c++",
    "embedded", "firmware", "cloud", "aws", "gcp", "docker",
    "kubernetes", "pytorch", "tensorflow",
]

# Hard penalties — likely not internship-appropriate.
PENALTY_PATTERNS = [
    (r"\b(senior|staff|principal|lead)\b", 60, "senior-level title"),
    (r"\bnew grad\b|\bnew graduate\b", 40, "new-grad-only role"),
    (r"\b[3-9]\+? ?years\b|\b[3-9] or more years\b", 25, "requires 3+ years"),
    (r"\bphd required\b|\bph\.d\. required\b", 20, "PhD required"),
]

SEASONS = [
    "summer 2026", "fall 2026", "spring 2027", "summer 2027",
    "fall 2027", "spring 2028", "off-cycle", "year-round", "co-op",
]
