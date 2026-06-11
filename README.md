# 🍁 Imm Channel

**A personalized, continuously-updated roadmap from "I want to move to Canada" to Canadian citizenship — with minimal personal data.**

## Why this exists when IRCC has a wizard

IRCC's [Come to Canada](https://www.canada.ca/en/immigration-refugees-citizenship/services/come-canada-tool.html) tool answers one question: *are you eligible for a program today?* Most people aren't — yet. Imm Channel answers the question people actually have:

> "What's my best **sequence of moves** over the next 1–6 years, what will it cost, and how do I get all the way to citizenship?"

| IRCC's tool | Imm Channel |
|---|---|
| Point-in-time eligibility, per program | Ranked multi-year pathways (Express Entry, PNP, study→PGWP→CEC, work-permit-first) |
| Stops at "you may apply" | Plans through PR to the citizenship oath (1,095-day rule, pre-PR half-credit) |
| You re-read the rules after every announcement | A policy monitor watches IRCC news + draws; rules are versioned with `lastVerified` dates |
| No score strategy | Quantified boosters recomputed from *your* profile ("+62 if you reach CLB 10") |

**Privacy:** the questionnaire collects no identifiers — age, education, language levels, work experience, funds band. Everything runs client-side; answers never leave the browser. There are no accounts and no analytics on profile data.

## MVP scope

- **Audience:** skilled workers and prospective international students (federal programs; Quebec excluded).
- **Programs modeled:** Express Entry (FSW with the 67-point grid, CEC, FST), full CRS calculator, PNP at a high level, study permit → PGWP → CEC, LMIA work-permit route, citizenship requirements.
- **Special measures:** the Hong Kong public policy (Stream A and Stream B — no points grid, CLB 5) as fully ranked pathways, plus status notices for CUAET (Ukraine), Afghan programs, and the EMPP for people with refugee/displaced status. One optional citizenship question powers these; "prefer not to say" is the default.
- **Languages:** English, French, Traditional Chinese, Simplified Chinese. The questionnaire, navigation, and result labels are fully translated (`lib/i18n/`); engine-generated plan prose is English-first with a visible note in other locales.
- **Guides:** step-level "rabbit holes" — `/guides/study-permit` and `/guides/express-entry` — linked from the roadmap's steps and the "Your next move" panel.
- **Live data:** Express Entry draw cutoffs from IRCC's published JSON (with a bundled snapshot fallback when the feed is unreachable).
- **Policy watch (hybrid):** `scripts/policy-monitor.mjs` runs on a schedule via GitHub Actions, diffs IRCC's news feed and draw rounds against `data/monitor-state.json`, and opens a `policy-monitor` issue for human review. Rules are only changed by a human after verifying the official source.

## Architecture

```
app/
  page.tsx              Landing: value proposition vs IRCC's tool
  plan/page.tsx         Questionnaire wizard → ranked roadmap (client-side)
  updates/page.tsx      Recent draws (live/snapshot) + curated policy-change feed
  methodology/page.tsx  Data sources, lastVerified dates, limitations
  api/ee-draws/route.ts Cached proxy for IRCC's rounds JSON
components/             Wizard, results (pathway cards, timelines, boosters)
lib/
  crs.ts                Full CRS calculator (unit-tested golden profiles)
  fsw.ts                FSW 67-point selection grid
  eligibility.ts        CEC / FSW / FST structured requirement checks
  roadmap.ts            Pathway generator: steps, timelines, costs, citizenship ETA
  language.ts           IELTS / CELPIP / PTE Core → CLB conversion
  draws.ts              Live IRCC draw data with snapshot fallback
  rules/parameters.ts   Versioned policy parameters + sources + lastVerified
data/
  policy-updates.json   Human-curated change feed shown on /updates
  ee-draws-snapshot.json  Offline fallback for draw data
  monitor-state.json    Last seen draw number / news date for the monitor
scripts/policy-monitor.mjs    Feed watcher (no dependencies, Node 22+)
.github/workflows/policy-monitor.yml  Scheduled check → review issue
```

### The hybrid policy-update model

1. **Automated detection** — the workflow polls IRCC's Express Entry rounds JSON and news Atom feed twice a week.
2. **Human verification** — changes open/append to a GitHub issue; a maintainer checks the official text.
3. **Versioned application** — rule edits land in `lib/rules/parameters.ts` (bump `RULES_VERSION` and `lastVerified`) plus a plain-language entry in `data/policy-updates.json`.
4. **Exception:** draw cutoffs need no review — they're served straight from IRCC's feed at runtime.

This keeps the site current without ever letting an unreviewed scrape change eligibility logic — wrong immigration advice is worse than stale advice with a visible `lastVerified` date.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # CRS / FSW / language-conversion golden tests
npm run build      # production build
npm run monitor    # run the IRCC feed check locally
```

## Deliberate non-goals (for now)

- No accounts, emails, or stored profiles. The natural phase 2 — "alert me when a policy change affects *my* plan" — requires opt-in email + a stored anonymous profile (the Supabase schema slot in the stack is reserved for exactly this).
- No Quebec economic programs, family sponsorship, refugee/humanitarian streams.
- No representation or advice. Prominent disclaimers everywhere; we link to the official source at every step.

## Disclaimer

Imm Channel is an independent informational tool, not affiliated with IRCC or the Government of Canada, and is not legal advice. Immigration rules change frequently — always verify against [canada.ca](https://www.canada.ca/en/services/immigration-citizenship.html) and consider a licensed representative (RCIC or immigration lawyer).
