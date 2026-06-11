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
- Visualizes blockers as a dependency graph so you can see exactly what's blocking you
- Simulates deadline urgency based on how long verification actually takes
- Generates the questions to ask the organizer, the questions to ask your advisor, and a ready-to-send email draft

## What it doesn't do

VisaLens is not a chatbot. It does not give legal or immigration advice. It shows what needs to be verified so you can make an informed decision yourself.

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
- **Dashboard** at `/radar`: Apply Now, Found Today, Source-of-Truth Only,
  and Source Health views; one click opens the full VisaLens eligibility
  report for any role

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
