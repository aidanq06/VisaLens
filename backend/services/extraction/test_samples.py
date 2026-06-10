# 5 demo test cases

from .extractor import ExtractionEngine

TEST_SAMPLES = [
    {
        "title": "Global AI Student Hackathon",
        "text": (
            "Online AI hackathon open to students ages 13–22 worldwide. "
            "Teams submit a GitHub repository and a short video demo. "
            "No employment or payment is involved."
        ),
        "student_context": "F-1 international student",
        "expected_paid_status": "unpaid",
        "expected_international_eligibility": "likely_eligible",
    },
    {
        "title": "National Research Fellowship",
        "text": (
            "Applicants must be U.S. citizens or permanent residents. "
            "International students are not eligible for this program. "
            "Selected fellows receive a summer stipend."
        ),
        "student_context": "F-1 international student",
        "expected_paid_status": "paid",
        "expected_international_eligibility": "likely_not_eligible",
    },
    {
        "title": "Paid Summer AI Internship",
        "text": (
            "Paid summer AI internship for undergraduate students enrolled at U.S. universities. "
            "Applicants must be eligible to work in the United States. "
            "Start date: June 13, 2026."
        ),
        "student_context": "F-1 international student",
        "expected_paid_status": "paid",
        "expected_international_eligibility": "unclear",
    },
    {
        "title": "Summer Research Program",
        "text": (
            "Summer research program for undergraduate students enrolled at accredited U.S. institutions. "
            "Students will work with faculty mentors on machine learning projects. "
            "Funding may be available."
        ),
        "student_context": "F-1 international student",
        "expected_paid_status": "unknown",
        "expected_international_eligibility": "unclear",
    },
    {
        "title": "Remote Data Science Competition",
        "text": (
            "Remote data science competition open to students worldwide. "
            "International students are welcome. "
            "No work authorization is required. "
            "Participants submit a project report and presentation."
        ),
        "student_context": "F-1 international student",
        "expected_paid_status": "unknown",
        "expected_international_eligibility": "likely_eligible",
    },
]


def run_rule_based_tests() -> None:
    engine = ExtractionEngine()

    for sample in TEST_SAMPLES:
        result = engine.extract(
            title=sample["title"],
            text=sample["text"],
            student_context=sample["student_context"],
        )

        paid_ok = result.paid_status == sample["expected_paid_status"]
        intl_ok = result.international_eligibility == sample["expected_international_eligibility"]

        print(f"{'=' * 60}")
        print(f"Title               : {sample['title']}")
        print(f"opportunity_type    : {result.opportunity_type}")
        print(f"paid_status         : {result.paid_status}")
        print(f"international_elig  : {result.international_eligibility}")
        print(f"work_auth_language  : {result.work_authorization_language}")
        print(f"citizenship_req     : {result.citizenship_requirement}")
        print(f"paid_status check   : {'PASS' if paid_ok else 'FAIL'}"
              f"  (expected={sample['expected_paid_status']})")
        print(f"intl_eligibility chk: {'PASS' if intl_ok else 'FAIL'}"
              f"  (expected={sample['expected_international_eligibility']})")
        print(f"Evidence ({len(result.evidence)} items):")
        for ev in result.evidence:
            print(f"  [{ev.confidence:.2f}] {ev.field} = {ev.value!r}")
            print(f"          src: {ev.source_text!r}")
        print()


if __name__ == "__main__":
    run_rule_based_tests()
