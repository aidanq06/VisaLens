"""
Deterministic pre-LLM extraction layer.

PHRASE_RULES maps each ExtractedOpportunity field name to a list of pattern
descriptors. Each descriptor is matched against raw opportunity text before any
LLM call, producing zero-or-more EvidenceItem candidates with a normalized
label and a calibrated confidence score. The LLM pass later reconciles or
overrides these signals for ambiguous fields.
"""

import re
from typing import TypedDict


class RuleEntry(TypedDict):
    pattern: re.Pattern
    label: str
    confidence: float


def _r(pattern: str, label: str, confidence: float) -> RuleEntry:
    return {
        "pattern": re.compile(pattern, re.IGNORECASE),
        "label": label,
        "confidence": confidence,
    }


PHRASE_RULES: dict[str, list[RuleEntry]] = {
    # ------------------------------------------------------------------
    "paid_status": [
        _r(r"paid internship",              "paid",   0.95),
        _r(r"paid position",                "paid",   0.95),
        _r(r"paid summer",                  "paid",   0.95),
        _r(r"\bstipend\b",                  "paid",   0.95),
        _r(r"\bsalary\b",                   "paid",   0.95),
        _r(r"\bcompensation\b",             "paid",   0.95),
        _r(r"\$[\d,]+",                     "paid",   0.95),
        _r(r"fellows receive",              "paid",   0.95),
        _r(r"\bhourly\b",                   "paid",   0.95),
        _r(r"\bunpaid\b",                   "unpaid", 0.95),
        _r(r"\bvolunteer\b",                "unpaid", 0.95),
        _r(r"no compensation",              "unpaid", 0.95),
        _r(r"no payment",                   "unpaid", 0.95),
        _r(r"no employment or payment",     "unpaid", 0.95),
        # Negated lists like "No employment, compensation, or work authorization"
        _r(r"no employment[^.\n]{0,60}compensation", "unpaid", 0.96),
    ],

    # ------------------------------------------------------------------
    "work_authorization_language": [
        _r(r"eligible to work in the united states", "eligible to work in the united states", 0.97),
        _r(r"eligible to work in the u\.s",          "eligible to work in the u.s.",          0.97),
        _r(r"legally authorized to work",            "legally authorized to work",             0.97),
        _r(r"work authorization required",           "work authorization required",            0.97),
        _r(r"employment authorization",              "employment authorization",               0.97),
        _r(r"\bCPT\b",                               "CPT",                                   0.97),
        _r(r"\bOPT\b",                               "OPT",                                   0.97),
        _r(r"no work authorization required",        "no work authorization required",         0.97),
    ],

    # ------------------------------------------------------------------
    "citizenship_requirement": [
        _r(r"u\.s\. citizens only",                      "U.S. citizens only",                      0.97),
        _r(r"u\.s\. citizen",                            "U.S. citizen",                            0.97),
        _r(r"u\.s\. citizens or permanent residents",    "U.S. citizens or permanent residents",    0.97),
        _r(r"\bpermanent residents\b",                   "permanent residents",                     0.97),
        _r(r"\bgreen card holders\b",                    "green card holders",                      0.97),
        _r(r"international students are not eligible",   "international students are not eligible", 0.97),
        _r(r"non-u\.s\. citizens are not eligible",      "non-U.S. citizens are not eligible",      0.97),
        # Phrasings like "International students and students on temporary visas are not eligible"
        _r(r"international students[^.\n]{0,80}not eligible", "international students are not eligible", 0.97),
        _r(r"temporary visas?[^.\n]{0,60}not eligible",       "international students are not eligible", 0.97),
    ],

    # ------------------------------------------------------------------
    "international_eligibility": [
        _r(r"open worldwide",                        "likely_eligible", 0.95),
        _r(r"students worldwide",                    "likely_eligible", 0.95),
        _r(r"all countries",                         "likely_eligible", 0.95),
        _r(r"\bglobal\b",                            "likely_eligible", 0.95),
        _r(r"international students welcome",        "likely_eligible", 0.95),
        _r(r"international students are eligible",   "likely_eligible", 0.95),
        _r(r"\bworldwide\b",                         "likely_eligible", 0.95),
    ],

    # ------------------------------------------------------------------
    "location_requirement": [
        _r(r"\bremote\b",                       "remote",             0.90),
        _r(r"\bonline\b",                       "online",             0.90),
        _r(r"\bhybrid\b",                       "hybrid",             0.90),
        _r(r"\bin-person\b",                    "in-person",          0.90),
        _r(r"\bunited states\b",                "United States",      0.90),
        _r(r"\bu\.s\.\b",                       "U.S.",               0.90),
        _r(r"must be located in the u\.s",      "must be located in the U.S.", 0.90),
        _r(r"open worldwide",                   "worldwide",          0.90),
    ],

    # ------------------------------------------------------------------
    "funding_restriction": [
        _r(r"funding restricted to u\.s\. citizens",  "funding restricted to U.S. citizens", 0.92),
        _r(r"\bfederal funding\b",                    "federal funding",                     0.92),
        _r(r"\bNSF REU\b",                            "NSF REU",                             0.92),
        _r(r"funding may be available",               "funding may be available",            0.92),
        _r(r"citizenship-based funding",              "citizenship-based funding",           0.92),
        # "Funding is restricted to ..." / "funding restricted by ..."
        _r(r"funding (?:is |may be )?restricted",     "funding restricted by citizenship or residency", 0.92),
    ],

    # ------------------------------------------------------------------
    "student_level_requirement": [
        _r(r"\bhigh school\b",              "high school",                0.88),
        _r(r"\bundergraduate\b",            "undergraduate",              0.88),
        _r(r"\bgraduate\b",                 "graduate",                   0.88),
        _r(r"\bfreshman\b",                 "freshman",                   0.88),
        _r(r"\bsophomore\b",                "sophomore",                  0.88),
        _r(r"\bjunior\b",                   "junior",                     0.88),
        _r(r"\bsenior\b",                   "senior",                     0.88),
        _r(r"\bcollege students\b",         "college students",           0.88),
        _r(r"accredited u\.s\. institutions","accredited U.S. institutions",0.88),
        _r(r"u\.s\. universities",          "U.S. universities",          0.88),
    ],

    # ------------------------------------------------------------------
    "deadline_or_start_date": [
        _r(
            r"\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}\b",
            "date_mention",
            0.90,
        ),
        _r(r"\b\d{1,2}/\d{1,2}/\d{4}\b",  "date_mention",       0.90),
        _r(r"application deadline",         "application deadline",0.90),
        _r(r"applications due",             "applications due",   0.90),
        _r(r"\bstart date\b",              "start date",         0.90),
        _r(r"\bsummer 2026\b",             "summer 2026",        0.90),
    ],

    # ------------------------------------------------------------------
    "required_materials": [
        _r(r"\bresume\b",                  "resume",               0.93),
        _r(r"\bCV\b",                      "CV",                   0.93),
        _r(r"\btranscript\b",              "transcript",           0.93),
        _r(r"\bcover letter\b",            "cover letter",         0.93),
        _r(r"\bgithub repository\b",       "github repository",    0.93),
        _r(r"\bportfolio\b",               "portfolio",            0.93),
        _r(r"\brecommendation letter\b",   "recommendation letter",0.93),
        _r(r"\bessay\b",                   "essay",                0.93),
        _r(r"\bproject report\b",          "project report",       0.93),
        _r(r"\bpresentation\b",            "presentation",         0.93),
        _r(r"\bvideo demo\b",              "video demo",           0.93),
        _r(r"\bstatement of interest\b",   "statement of interest",0.93),
    ],

    # ------------------------------------------------------------------
    "ambiguous_phrases": [
        _r(r"funding may be available",     "funding may be available",    0.70),
        _r(r"must be eligible",             "must be eligible",            0.70),
        _r(r"authorization required",       "authorization required",      0.70),
        _r(r"u\.s\. institutions",          "u.s. institutions",           0.70),
        _r(r"remote but must be located",   "remote but must be located",  0.70),
        _r(r"work with faculty mentors",    "work with faculty mentors",   0.70),
        _r(r"\blegal authorization\b",      "legal authorization",         0.70),
        _r(r"sponsorship not provided",     "sponsorship not provided",    0.70),
    ],

    # ------------------------------------------------------------------
    "opportunity_type": [
        _r(r"\bhackathon\b",    "hackathon",   0.95),
        _r(r"\binternship\b",   "internship",  0.95),
        _r(r"\bfellowship\b",   "fellowship",  0.95),
        _r(r"\bresearch\b",     "research",    0.95),
        _r(r"\bcompetition\b",  "competition", 0.95),
        _r(r"\bscholarship\b",  "scholarship", 0.95),
    ],
}
