# VisaLens — Demo Guide

The complete story in one line: **the Radar finds internships early, VisaLens
instantly scores eligibility risk for international students, and the
verification kit turns "I'm not sure I can apply" into an action plan.**

---

## 0. Setup (once, ~2 minutes before the demo)

```bash
# Terminal 1 — backend
cd backend
pip3 install -r requirements.txt
python3 radar_cli.py seed      # seed companies + GitHub lists (only needed once)
python3 radar_cli.py scan      # populate the radar with live internships
python3 -m uvicorn main:app --port 8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Optional: set `DISCORD_WEBHOOK_URL` in
`backend/.env` to show live Discord alerts.

**Pre-demo check (30 seconds):** open `/radar` — you should see roles with
scores. Open `/scan`, click the `internship` chip, submit — you should land
on a results page. If both work, you're demo-ready.

---

## 1. The demo script (~3 minutes)

### Beat 1 — Landing page (15s)
"International students face two problems: finding internships early enough,
and knowing whether they're even eligible to accept them. VisaLens solves
both in one workflow." Point at the 4-step strip: discover → extract →
score → verify.

### Beat 2 — Radar: discovery (45s)
Click **Find Internships**.

- Point at the stats strip: "~180 live roles, pulled directly from company
  career APIs — Greenhouse, Lever, Ashby — the same minute they go up,
  before they hit job boards."
- **Apply Now tab**: real internships at Notion, Cloudflare, Stripe, Palantir,
  ranked by urgency and personal fit. Every score is deterministic and
  auditable — no LLM guessing.
- Click **Source Health**: "this is a self-healing source graph — sources are
  auto-discovered from public lists, verified against the live API, scored,
  and retired when they break." (During our build it auto-discovered and
  promoted 17 new company sources on its own.)

### Beat 3 — The integration moment (45s)
Back on **Apply Now**, pick a role and click **Eligibility report**.

"Here's the part nothing else does: every discovered role has already been
through our risk engine." Walk the report top-down: risk score and why,
category breakdown, blocker graph, deadline-vs-verification timeline,
and the verification kit with questions for the organizer and DSO plus a
ready-to-send email. Click **Download report**.

### Beat 4 — Manual analysis: the contrast (60s)
Click **New scan** (or Manual analysis). Use the three sample chips —
they're rigged to show the full range:

1. **hackathon** chip → submit → **score 0, LOW risk**, open worldwide.
2. **research** chip (NSF REU) → submit → **score 100, HIGH risk**, citizenship
   restriction detected, blocker graph shows the dependency chain.
3. **internship** chip → submit → **HIGH/unclear**: paid + "eligible to work in
   the U.S." language, and the timeline shows verification takes ~5 days but
   only 2 remain — "ask the organizer today."

### Beat 5 — Close (15s)
"Deterministic risk engine, evidence with confidence scores, responsible
language — it never says 'you're eligible,' it tells you exactly what to
verify and who to ask. Find it early, know your risk, apply with confidence."

---

## Live-wow options (if time allows)

- Click **Scan now** on the radar during the demo — it re-checks due sources
  live and pulls in anything new.
- Paste a real posting from any Greenhouse/Lever job page into `/scan` to
  show it working on unseen data.

## If something breaks

- **Radar empty / backend down** → the radar shows an error banner; restart
  `uvicorn`. Roles persist in `backend/radar.db`, so a scan is not needed
  mid-demo.
- **Results page** → if the live flow fails, `/results?demo=true` always
  renders a polished demo report (marked with a "Demo data" badge).
- **Full radar reset**: delete `backend/radar.db`, then re-run
  `python3 radar_cli.py seed && python3 radar_cli.py scan`.
