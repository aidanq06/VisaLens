/**
 * Demo opportunities covering the three headline scenarios:
 * medium-high (verify first), high (blocked), and low (safe).
 * Used by the scanner's one-click sample buttons and for testing.
 */

export type SampleOpportunity = {
  id: string;
  title: string;
  category: string;
  expectedRisk: "low" | "moderate" | "medium_high" | "high";
  text: string;
};

export const sampleOpportunities: SampleOpportunity[] = [
  {
    id: "paid-ai-internship",
    title: "Paid AI internship (unclear eligibility)",
    category: "internship",
    expectedRisk: "high",
    text: `Paid Summer AI Internship — Applications Open!

We're looking for undergraduate students to join our AI research team this summer. Interns will receive a competitive stipend and work alongside senior engineers on production machine learning systems.

Eligibility: Applicants must be currently enrolled at a U.S. university and must be eligible to work in the United States. Start date: June 13, 2026.

To apply, submit your resume and a short statement of interest.`,
  },
  {
    id: "nsf-research-program",
    title: "NSF-funded research program (citizens/PR only)",
    category: "research",
    expectedRisk: "high",
    text: `Summer Research Experience in Computational Biology

Join our 10-week intensive research program. Participants receive a $6,000 stipend, housing, and travel support. This program is NSF-funded; participation is restricted to U.S. citizens or permanent residents.

Open to undergraduate juniors and seniors majoring in biology, computer science, or related fields. Application deadline: June 25, 2026.`,
  },
  {
    id: "global-online-hackathon",
    title: "Global online hackathon (open worldwide)",
    category: "hackathon",
    expectedRisk: "low",
    text: `Global Health Hackathon 2026 — Build for Good

A 48-hour virtual hackathon focused on AI solutions for global health. Open to students worldwide — no citizenship requirement, and international students are welcome. Participation is free and fully remote.

Prizes include cloud credits and mentorship opportunities. This is a competition, not employment; no work authorization is needed. Registration closes July 20, 2026.`,
  },
];
