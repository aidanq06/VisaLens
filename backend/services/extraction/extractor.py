# Main extraction pipeline
# Step 1 — Rule-based extraction: deterministic regex/keyword matching against PHRASE_RULES
# Step 2 — LLM extraction: call hosted model for semantic understanding (skipped if no token)
# Step 3 — Merge: rule-based overrides LLM for fields with confidence >= 0.90
# Step 4 — Normalize and return: clean, infer eligibility, validate into ExtractedOpportunity

import json
import logging
import os
import re

import requests

from .normalizer import infer_international_eligibility, normalize_extraction
from .phrase_rules import PHRASE_RULES
from .prompt import build_extraction_prompt, parse_llm_response
from .schemas import EvidenceItem, ExtractedOpportunity

logger = logging.getLogger(__name__)

_LIST_FIELDS = {"required_materials", "ambiguous_phrases"}

_FIELD_DEFAULTS: dict = {
    "opportunity_type": "unknown",
    "paid_status": "unknown",
    "work_authorization_language": None,
    "citizenship_requirement": None,
    "international_eligibility": "unknown",
    "location_requirement": None,
    "deadline_or_start_date": None,
    "funding_restriction": None,
    "student_level_requirement": None,
    "remote_or_global_status": None,
    "required_materials": [],
    "ambiguous_phrases": [],
    "evidence": [],
}


def _find_sentence(text: str, match_start: int) -> str:
    left = max(text.rfind("\n", 0, match_start), text.rfind(".", 0, match_start))
    sent_start = left + 1 if left >= 0 else 0

    right_nl = text.find("\n", match_start)
    right_dot = text.find(".", match_start)
    right_nl = right_nl if right_nl >= 0 else len(text)
    right_dot = right_dot if right_dot >= 0 else len(text)
    sent_end = min(right_nl, right_dot) + 1

    return text[sent_start:sent_end].strip()


def _dedup_evidence(items: list[EvidenceItem]) -> list[EvidenceItem]:
    seen_single: dict[str, EvidenceItem] = {}
    seen_list: dict[tuple[str, str], EvidenceItem] = {}

    for item in items:
        if item.field in _LIST_FIELDS:
            key = (item.field, item.value)
            if key not in seen_list or item.confidence > seen_list[key].confidence:
                seen_list[key] = item
        else:
            if item.field not in seen_single or item.confidence > seen_single[item.field].confidence:
                seen_single[item.field] = item

    return list(seen_single.values()) + list(seen_list.values())


class ExtractionEngine:

    def __init__(self) -> None:
        self.hf_token = os.getenv("HF_API_TOKEN")
        self.model_url = "https://router.huggingface.co/novita/v3/openai/chat/completions"
        self.model_id = "google/gemma-3-12b-it"

    def extract(
        self, title: str, text: str, student_context: str = "unknown"
    ) -> ExtractedOpportunity:

        # ── Step 1: Rule-based extraction ─────────────────────────────────────
        rule_evidence: list[EvidenceItem] = []
        rule_singles: dict[str, tuple[str, float]] = {}  # field -> (label, confidence)
        rule_lists: dict[str, list[str]] = {}             # field -> [label, ...]

        for field, rules in PHRASE_RULES.items():
            for rule in rules:
                for match in rule["pattern"].finditer(text):
                    source = _find_sentence(text, match.start())
                    rule_evidence.append(
                        EvidenceItem(
                            field=field,
                            value=rule["label"],
                            source_text=source,
                            confidence=rule["confidence"],
                        )
                    )
                    if field in _LIST_FIELDS:
                        rule_lists.setdefault(field, []).append(rule["label"])
                    else:
                        existing = rule_singles.get(field)
                        # >= keeps the last (more specific) pattern when confidence ties
                        if existing is None or rule["confidence"] >= existing[1]:
                            rule_singles[field] = (rule["label"], rule["confidence"])

        # ── Step 2: LLM extraction ─────────────────────────────────────────────
        llm_result: dict = {}
        if self.hf_token is not None:
            try:
                schema_example = json.dumps(
                    ExtractedOpportunity.model_config["json_schema_extra"]["example"],
                    indent=2,
                )
                prompt = build_extraction_prompt(title, text, student_context, schema_example)
                response = requests.post(
                    self.model_url,
                    headers={
                        "Authorization": f"Bearer {self.hf_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model_id,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.1,
                    },
                    timeout=30,
                )
                response.raise_for_status()
                data = response.json()
                raw_text = data["choices"][0]["message"]["content"]
                llm_result = parse_llm_response(raw_text)
            except Exception as exc:
                logger.warning("LLM extraction failed: %s", exc)
                llm_result = {}

        # ── Step 3: Merge ──────────────────────────────────────────────────────
        # Base: safe defaults, then overlay LLM values
        merged: dict = dict(_FIELD_DEFAULTS)
        merged.update({k: v for k, v in llm_result.items() if k != "evidence"})

        # High-confidence rule singles override LLM for non-list fields
        for field, (label, confidence) in rule_singles.items():
            if confidence >= 0.90:
                merged[field] = label

        # Combine list fields from both sources, preserving insertion order
        for field in _LIST_FIELDS:
            llm_vals: list = (llm_result.get(field) or [])
            rule_vals: list = rule_lists.get(field, [])
            seen: set = set()
            combined = []
            for val in llm_vals + rule_vals:
                if val not in seen:
                    seen.add(val)
                    combined.append(val)
            merged[field] = combined

        # Combine and deduplicate evidence
        llm_evidence: list[EvidenceItem] = [
            EvidenceItem(**e) if isinstance(e, dict) else e
            for e in (llm_result.get("evidence") or [])
        ]
        merged["evidence"] = _dedup_evidence(rule_evidence + llm_evidence)

        # ── Step 4: Normalize and return ───────────────────────────────────────
        normalized = normalize_extraction(merged)

        inferred = infer_international_eligibility(normalized)
        if inferred != "unknown":
            normalized["international_eligibility"] = inferred

        return ExtractedOpportunity(**normalized)
