# VisaLens — Demo Guide

The complete story in one line: **the Radar finds internships early, the
Action Queue tells the student what to do first today, VisaLens scores
eligibility risk with auditable evidence, and when the organizer replies the
case updates itself — blockers resolved, score recalculated.**

Core pitch line: *"The LLM extracts ambiguity; deterministic systems make
the risk decision auditable."*

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
`backend/.env` to show live Discord alerts (alerts now carry action labels:
🔥 Apply now / ⚠️ Verify first / 🎓 Ask DSO first / 🚫 Likely blocked).

**Pre-demo check (30 seconds):** open `/radar` — the Action Queue should be
the first tab with grouped, labeled roles. Open `/scan`, click the
`internship` chip, submit — you should land on a results page with the
point-by-point "Why this score" trail. If both work, you're demo-ready.

**Morning of the demo:** run `python3 radar_cli.py scan` so freshness scores
are high and the Apply Now group is full.

---

## 1. The demo script (~3 minutes)

### Beat 1 — Landing page (15s)
"International students face two problems: finding internships early enough,
and knowing whether they can even accept them. VisaLens solves both — and it
doesn't stop at a report. It tells you what to do first, and it updates when
you get answers." Point at the 4-step strip: discover → extract/score →
action queue → verify & update.

### Beat 2 — Action Queue: the daily decision system (45s)
Click **Find Internships**. The Action Queue is the default view.

- Point at the impact strip: "~220 live roles triaged automatically —
  about 38 hours of manual review time saved, estimated."
- Walk the groups top-down: "**Apply now** — high fit, fresh, no detected
  restriction. **Ask DSO first** — confirmed paid roles where CPT/OPT
  coordination is the real question. **Likely blocked** — explicit
  citizenship or funding restrictions, filtered before the student wastes
  an evening on them."
- "Every label is deterministic — the reasons are printed on each card.
  No LLM decides anyone's fate here."

### Beat 3 — Auditable risk report (45s)
Click **Eligibility report** on any role — or go to `/scan` and submit the
`internship` sample chip for the strongest version.

Walk the **Why this score** trail: "+45 work authorization language — with
the exact sentence from the listing and 97% extraction confidence. +25 paid
role. +20 for the combination. +20 unclear international eligibility. The AI
extracts the evidence; the score is pure rules — clamped, auditable,
reproducible." Then flash the blocker graph, the timeline crunch, and the
verification kit with the ready-to-send organizer email.

### Beat 4 — The living case (45s) ← the wow moment
On the results page, click **Got a reply? Update case →**.

"The student sends that email. Two days later the organizer replies. Watch."
Click **Sample reply** (it's the canonical organizer response), then
**Analyze clarification**.

- Score animates 100 → 55, HIGH → MEDIUM-HIGH.
- Resolved: international eligibility — the organizer confirmed F-1 students
  may apply.
- Still needs verification: paid role, CPT/OPT work authorization, tight
  deadline.
- Case status: **"Conditionally possible — advisor verification needed."**

"It never says 'you're eligible.' It says exactly what got resolved, what
remains, and who to ask next. That's the difference between a chatbot answer
and case infrastructure."

### Beat 5 — Close (15s)
"Deterministic risk engine, evidence with confidence scores, a daily action
queue, and a case that updates as the student verifies. Find it early, know
your risk, act in the right order."

---

## Contrast cases (if time allows, ~30s)

On `/scan`, the three sample chips show the full range:

1. **hackathon** chip → **score 0, LOW** — open worldwide, no blockers.
2. **research** chip (NSF REU) → **score 100, HIGH** — citizenship + funding
   restriction, blocker chain in the graph.
3. **internship** chip → the Beat 3/4 case above.

## Live-wow options

- Click **Scan now** on the radar — it re-checks due sources live.
- Paste a real posting from any Greenhouse/Lever job page into `/scan`.
- Type your own "organizer reply" into `/case` and show the diff change —
  e.g. add "unfortunately international students are not eligible" and the
  status flips to *Likely not eligible*.

## If something breaks

- **Radar empty / backend down** → error banner; restart `uvicorn`. Roles
  persist in `backend/radar.db`, so a scan is not needed mid-demo.
- **Results page** → `/results?demo=true` always renders a polished demo
  report (marked "Demo data") including the score breakdown — no backend
  needed.
- **Case page** → needs the backend, but the sample-reply flow only takes
  one click to redo after a restart.
- **Full radar reset**: delete `backend/radar.db`, then re-run
  `python3 radar_cli.py seed && python3 radar_cli.py scan`.
