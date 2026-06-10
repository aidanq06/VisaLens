# VisaLens Frontend

Next.js 14 + TypeScript + Tailwind + React Flow (`@xyflow/react`).

## Run locally

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

The home page is a live scanner: pick your status, paste a listing (or load a sample), and hit Analyze. The full pipeline — extraction → risk scoring → blocker graph → timeline → verification kit — runs **entirely client-side** (`lib/analyze/analyzeOpportunity.ts`), so the demo needs no backend, API keys, or network. `/results` shows the dashboard plus a "Listing X-ray" with detected phrases highlighted in the original text.

Visiting `/results` directly falls back to `data/mockAnalysis.ts` demo data.

## Team contract

- `types/analysis.ts` — the shared `VisaLensAnalysis` schema. **Do not change without team agreement.** Field names match `backend/services/extraction/schemas.py`.
- `data/mockAnalysis.ts` — canonical mock everyone builds against.

## Ownership (per role split)

| Area | Owner |
|---|---|
| `components/workflow/*`, `lib/graphBuilder.ts`, `lib/timelineSimulator.ts`, `components/dashboard/ResultsDashboard.tsx` | Anson |
| `components/extraction/*` (replace `ExtractedFieldsPlaceholder`) | Pranav |
| `components/risk/*` (replace `RiskScorePlaceholder`) | Aidan |
| `components/verification/*`, `components/report/*`, `lib/verification/*`, `lib/report/*` | Rahul (done — integrated in dashboard) |

Remaining placeholders live in `ResultsDashboard.tsx` and already read from the shared schema — replacing one is a single import swap. The verification kit and report are fully integrated; their content falls back to risk-category-derived generation (`lib/verification/generateVerificationKit.ts`) when `analysis.verification` is missing.

## Analysis pipeline (client-side)

- `lib/analyze/phraseRules.ts` — deterministic extraction with sentence-level evidence + confidence (mirrors `backend/services/extraction/phrase_rules.py`)
- `lib/analyze/riskScoring.ts` — the team's agreed scoring rules (+90 citizens-only, +45 work-auth, +25 paid, −35 worldwide, etc.) with category breakdown and student-context adjustment
- `lib/analyze/analyzeOpportunity.ts` — orchestrates extract → score → graph → timeline → verification into one `VisaLensAnalysis`
- `data/sampleOpportunities.ts` — three one-click demo scenarios (risky internship, citizens-only NSF program, open-worldwide hackathon)

When the backend LLM extraction is ready, swap `extractOpportunity` for the API call in `analyzeOpportunity` — everything downstream consumes the same schema. The client rules remain the offline fallback.

## Backend integration

When `/analyze` is live, replace `mockAnalysis` in `app/page.tsx` with the fetched response. The dashboard accepts `PartialVisaLensAnalysis`, so missing sections degrade gracefully (the graph falls back to risk-derived generation, the timeline falls back to the extracted deadline).
