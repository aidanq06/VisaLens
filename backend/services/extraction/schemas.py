# Pydantic models

from typing import Literal, Optional
from pydantic import BaseModel, Field


class EvidenceItem(BaseModel):
    field: str
    value: str
    source_text: str
    confidence: float = Field(ge=0.0, le=1.0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "field": "paid_status",
                "value": "paid",
                "source_text": "Recipients will receive a $5,000 stipend for the 10-week program.",
                "confidence": 0.95,
            }
        }
    }


class ExtractedOpportunity(BaseModel):
    opportunity_type: str
    paid_status: Literal["paid", "unpaid", "unknown"]
    work_authorization_language: Optional[str]
    citizenship_requirement: Optional[str]
    international_eligibility: Literal[
        "likely_eligible", "likely_not_eligible", "unclear", "unknown"
    ]
    location_requirement: Optional[str]
    deadline_or_start_date: Optional[str]
    funding_restriction: Optional[str]
    student_level_requirement: Optional[str]
    remote_or_global_status: Optional[str]
    required_materials: list[str]
    ambiguous_phrases: list[str]
    evidence: list[EvidenceItem]

    model_config = {
        "json_schema_extra": {
            "example": {
                "opportunity_type": "research internship",
                "paid_status": "paid",
                "work_authorization_language": "Applicants must be authorized to work in the United States.",
                "citizenship_requirement": None,
                "international_eligibility": "likely_not_eligible",
                "location_requirement": "On-site at MIT campus, Cambridge MA",
                "deadline_or_start_date": "2024-02-15",
                "funding_restriction": "NSF funding; recipients must be U.S. citizens or permanent residents.",
                "student_level_requirement": "Undergraduate juniors and seniors",
                "remote_or_global_status": None,
                "required_materials": ["CV", "personal statement", "two letters of recommendation"],
                "ambiguous_phrases": ["must be eligible to work in the U.S."],
                "evidence": [
                    {
                        "field": "paid_status",
                        "value": "paid",
                        "source_text": "Recipients will receive a $5,000 stipend for the 10-week program.",
                        "confidence": 0.95,
                    },
                    {
                        "field": "international_eligibility",
                        "value": "likely_not_eligible",
                        "source_text": "NSF funding; recipients must be U.S. citizens or permanent residents.",
                        "confidence": 0.90,
                    },
                ],
            }
        }
    }
