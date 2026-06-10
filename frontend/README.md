# VisaLens Frontend

Next.js 14 + TypeScript + Tailwind + React Flow (`@xyflow/react`).

## Run locally

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

The home page renders the full results dashboard from `data/mockAnalysis.ts` — no backend needed.

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

## Backend integration

When `/analyze` is live, replace `mockAnalysis` in `app/page.tsx` with the fetched response. The dashboard accepts `PartialVisaLensAnalysis`, so missing sections degrade gracefully (the graph falls back to risk-derived generation, the timeline falls back to the extracted deadline).
