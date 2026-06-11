# VisaLens AI

Don't lose the opportunity after finding it.

> **Demoing this project?** Follow the 3-minute script in [DEMO.md](DEMO.md) — it covers the full workflow: radar discovery → eligibility risk → verification kit.

---

International students spend hours decoding opportunity listings, trying to figure out if "must be eligible to work in the U.S." means they can't apply, or if a paid fellowship requires work authorization, or if the deadline is even realistic given how long verification takes.

VisaLens turns that confusion into a structured risk report. Paste an opportunity, get back extracted requirements, a risk score, a blocker graph, timeline urgency, and the exact questions to ask before you apply.

---

## What it does

- Extracts hidden eligibility signals from opportunity text (work auth language, citizenship restrictions, funding limits)
- Scores risk across seven categories using deterministic rules — not just AI guessing
- Shows the score point by point: every +45 or +25 is tied to an evidence snippet from the listing, with a confidence score
- Visualizes blockers as a dependency graph so you can see exactly what's blocking you
- Simulates deadline urgency based on how long verification actually takes
- Generates the questions to ask the organizer, the questions to ask your advisor, and a ready-to-send email draft
- **Action Queue**: classifies every discovered role into *apply now / verify first / ask DSO first / likely blocked / watch* — so the student knows what to do first today, not just what exists
- **Living case**: paste the organizer's reply and the case re-analyzes — risk score before → after, blockers resolved, blockers remaining, updated recommendation

## What it doesn't do

VisaLens is not a chatbot. It does not give legal or immigration advice. It shows what needs to be verified so you can make an informed decision yourself.

> The LLM extracts ambiguity; deterministic systems make the risk decision auditable.

---

<img width="886" height="738" alt="Screenshot 2026-06-10 at 11 24 33 AM" src="https://github.com/user-attachments/assets/3dc37c18-7cf7-40cd-a31c-0c24f396cdcc" />


---


## InternRadar — early discovery + eligibility in one workflow

VisaLens now finds the opportunities too. InternRadar monitors company
source-of-truth career feeds directly (official Greenhouse / Lever / Ashby
job-board APIs plus public GitHub internship lists), so roles surface here
before they spread to public job boards — and every discovered role gets an
automatic VisaLens eligibility analysis.

The full workflow: **discover early → score fit & urgency → check visa risk →
verify → apply.**

- **Self-healing source graph** — candidate sources are auto-discovered from
  ATS links in public lists, verified against the live API, promoted to
  monitored sources, and retired with exponential backoff when they break
- **Deterministic scoring** — freshness (1h/6h/24h bands), personal fit
  (SWE/AI/ML/backend/systems/embedded + stack keywords), and urgency; no
  per-job LLM calls, every point auditable
- **Dedupe across sources** + tracking of whether the radar found a posting
  before the public lists did
- **Discord alerts** — red at urgency ≥ 85, yellow at ≥ 70 (set
  `DISCORD_WEBHOOK_URL`)
- **Action Queue** (default view at `/radar`): every tracked role classified
  into apply now / verify first / ask DSO first / likely blocked / watch /
  low priority — deterministic, with reasons and next steps per role, plus an
  estimated-review-time-saved impact strip
- **Dashboard** at `/radar`: Action Queue, Apply Now, Found Today,
  Source-of-Truth Only, and Source Health views; one click opens the full
  VisaLens eligibility report for any role
- **Case workspace** at `/case`: paste the organizer/advisor reply and the
  case updates — score before → after, resolved and remaining blockers,
  updated recommendation and report

No LinkedIn/Indeed/Handshake scraping, no login-gated scraping, no CAPTCHA
bypassing — only public, unauthenticated, structured endpoints.

### Radar quickstart

```bash
cd backend
pip3 install -r requirements.txt
python3 radar_cli.py seed       # seed ~22 companies + GitHub lists
python3 radar_cli.py scan       # check all due sources
python3 radar_cli.py discover   # verify + promote discovered sources
python3 radar_cli.py loop 30    # keep scanning every 30 minutes

python3 -m uvicorn main:app --port 8000   # API (also exposes /api/radar/*)
cd ../frontend && npm install && npm run dev   # dashboard at /radar
```

Storage is a local SQLite file (`backend/radar.db`); the schema is written
portably so it can be lifted to Supabase Postgres later.
