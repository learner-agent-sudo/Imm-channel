# 🍁 Imm Channel

**A personalized, continuously-updated roadmap from "I want to move to Canada" to Canadian citizenship — with minimal personal data.**

**Live site:** https://learner-agent-sudo.github.io/Imm-channel/

## Why this exists when IRCC has a wizard

IRCC's [Come to Canada](https://www.canada.ca/en/immigration-refugees-citizenship/services/come-canada-tool.html) tool answers one question: *are you eligible for a program today?* Most people aren't — yet. Imm Channel answers the question people actually have:

> "What's my best **sequence of moves** over the next 1–6 years, what will it cost, and how do I get all the way to citizenship?"

| IRCC's tool | Imm Channel |
|---|---|
| Point-in-time eligibility, per program | Ranked multi-year pathways (Express Entry, PNP, study→PGWP→CEC, work-permit-first) |
| Stops at "you may apply" | Plans through PR to the citizenship oath (1,095-day rule, pre-PR half-credit) |
| You re-read the rules after every announcement | A policy monitor watches IRCC news + draws; rules are versioned with `lastVerified` dates |
| No score strategy | Quantified boosters recomputed from *your* profile ("+62 if you reach CLB 10") |

**Privacy:** the questionnaire collects no identifiers — age, education, language levels, work experience, funds band, plus optional citizenship and refugee-status questions that unlock special programs. Everything runs client-side; answers never leave the browser. There are no accounts, cookies, analytics or third-party scripts, and a strict Content-Security-Policy stops pages from contacting any other site (see [Security](#security)).

## MVP scope

- **Audience:** skilled workers and prospective international students (federal programs; Quebec excluded).
- **Programs modeled:** Express Entry (FSW with the 67-point grid, CEC, FST), full CRS calculator, PNP at a high level, study permit → PGWP → CEC, LMIA work-permit route, citizenship requirements.
- **Special measures:** the Hong Kong public policy (Stream A and Stream B — no points grid, CLB 5) as fully ranked pathways, plus status notices for CUAET (Ukraine), Afghan programs, and the EMPP for people with refugee/displaced status. One optional citizenship question powers these; "prefer not to say" is the default.
- **Languages:** English, French, Traditional Chinese, Simplified Chinese. The questionnaire, navigation, and result labels are fully translated (`lib/i18n/`); engine-generated plan prose is English-first with a visible note in other locales.
- **Guides:** step-level "rabbit holes" — `/guides/study-permit` and `/guides/express-entry` — linked from the roadmap's steps and the "Your next move" panel.
- **Draw data:** Express Entry cutoffs from IRCC's published rounds JSON, refreshed daily into `data/ee-draws.json` and republished automatically — never more than about a day behind IRCC.
- **Policy watch (hybrid):** `scripts/policy-monitor.mjs` runs daily via GitHub Actions, diffs IRCC's news feed and draw rounds against `data/monitor-state.json`, and posts anything new to the `policy-monitor` review issue. Rules are only changed by a human after verifying the official source.

## Architecture

```
app/
  page.tsx              Landing: value proposition vs IRCC's tool
  plan/page.tsx         Questionnaire wizard → ranked roadmap (client-side)
  updates/page.tsx      Recent draws + curated policy-change feed
  methodology/page.tsx  Data sources, lastVerified dates, limitations
  guides/               Localized step-by-step guides (study permit, Express Entry)
  api/ee-draws.json/    Static JSON copy of the draw data (built at deploy)
components/             Wizard, results (pathway cards, timelines, boosters)
lib/
  crs.ts                Full CRS calculator (unit-tested golden profiles)
  fsw.ts                FSW 67-point selection grid
  eligibility.ts        CEC / FSW / FST structured requirement checks
  roadmap.ts            Pathway generator: steps, timelines, costs, citizenship ETA
  special-programs.ts   Nationality/status measures (Hong Kong, IEC, CUSMA, EMPP…)
  language.ts           IELTS / CELPIP / PTE Core → CLB conversion
  draws.ts              Reads data/ee-draws.json; maps draw names to categories
  i18n/                 UI strings in four languages
  rules/parameters.ts   Versioned policy parameters + sources + lastVerified
data/
  ee-draws.json         Recent Express Entry rounds — rewritten by the daily refresh
  policy-updates.json   Human-curated change feed shown on /updates
  monitor-state.json    Last seen draw number / news date for the monitor
scripts/
  policy-monitor.mjs    Daily feed check: refreshes draw data, reports news (Node 22+, no deps)
  ircc-draws.mjs        Defensive parser for IRCC's rounds feed (unit-tested)
  feed-safety.mjs       Untrusted-feed helpers: size/host checks, Atom parser, markdown escaping
  csp.mjs               Post-build: per-page Content-Security-Policy with hashed inline scripts
.github/workflows/site.yml  Test → build → deploy to GitHub Pages; daily data refresh
.github/dependabot.yml      Weekly dependency/action updates (7-day cooldown)
```

### The hybrid policy-update model

1. **Automated detection** — the daily workflow polls IRCC's Express Entry rounds JSON and news Atom feed.
2. **Human verification** — new announcements are posted to a GitHub issue; a maintainer checks the official text.
3. **Versioned application** — rule edits land in `lib/rules/parameters.ts` (bump `RULES_VERSION` and `lastVerified`) plus a plain-language entry in `data/policy-updates.json`.
4. **Exception:** draw cutoffs need no review — the workflow commits IRCC's published rounds to `data/ee-draws.json` and redeploys.

This keeps the site current without ever letting an unreviewed scrape change eligibility logic — wrong immigration advice is worse than stale advice with a visible `lastVerified` date.

## Hosting & deployment

The site is a **static export** (`output: "export"` in `next.config.ts`) hosted free on **GitHub Pages**. There is no server: the planner runs in the browser and the draw data is built into the pages. One workflow, `.github/workflows/site.yml`, does everything:

| Trigger | What happens |
|---|---|
| Push to the default branch | Test → build → deploy |
| Push to any other branch | Test → build (CI only) |
| Daily at 22:41 UTC | Refresh IRCC draws + news → commit changed data → redeploy only if draws changed → post news to the review issue |
| Manual ("Run workflow") | Like the daily run, but always redeploys |

The site lives under `/<repo>/`, so CI builds with `PAGES_BASE_PATH=/<repo>`. Internal links must go through `next/link`, which adds that prefix automatically.

**One-time setup:** Settings → Pages → Build and deployment → Source: **GitHub Actions**.

**Staying alive:** GitHub disables scheduled workflows after 60 days without repository activity (this repo's first monitor stopped that way in August 2026). The workflow re-enables itself on every daily run, and its data commits count as activity too.

## Security

The threat model is small — no server, no accounts, no stored data — so the protections focus on keeping visitors' answers in their browser and keeping the published site and data honest. Details and how to report a problem: [SECURITY.md](SECURITY.md).

- **Content-Security-Policy on every page.** GitHub Pages can't send security headers, so `scripts/csp.mjs` (run by `npm run build`) adds a `<meta>` policy to each exported page: only the site's own scripts may run, each inline script is pinned by its SHA-256 hash, and nothing may load from or send data to another origin. `form-action 'none'` and `base-uri 'none'` close the remaining injection tricks. The build fails if any page isn't fully covered.
- **No answer-dependent network traffic.** Result links whose target depends on your answers don't prefetch; the referrer policy is `no-referrer`.
- **Untrusted feeds.** The monitor only accepts https responses from canada.ca hosts, caps their size, parses Atom in linear time, validates every draw field against hard bounds and a plain-text allowlist, and refuses implausible jumps in its high-water marks (which would otherwise silence future reports). Everything it posts to GitHub issues is escaped — no links outside canada.ca/gc.ca, no @mentions, no images or HTML.
- **Least-privilege CI.** `site.yml` is split so the only job that installs and runs npm packages has a read-only token; the job that commits data runs no npm code and verifies the data's checksum from the refresh job. Install scripts are disabled (`.npmrc`, `npm ci --ignore-scripts`), npm registry signatures are verified, actions are pinned to commit SHAs, and every job has a timeout.

**Repository settings the owner should keep on** (Settings → …): Code security → Dependabot alerts + security updates, secret scanning + push protection, private vulnerability reporting, CodeQL default setup; Rules → a ruleset on the default branch blocking force-pushes and deletion; Environments → `github-pages` limited to the default branch; Actions → General → workflow permissions "Read repository contents".

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # golden scoring tests, roadmap/special-program tests, feed parser
npm run build      # static export into out/
npx serve out      # preview the exported site locally
npm run monitor    # run the IRCC feed check locally (report only)
```

## Deliberate non-goals (for now)

- No accounts, emails, or stored profiles. The natural phase 2 — "alert me when a policy change affects *my* plan" — requires opt-in email + a stored anonymous profile, which means adding a small backend (e.g. a Cloudflare Worker or Supabase) alongside the static site.
- No Quebec economic programs, family sponsorship, refugee/humanitarian streams.
- No representation or advice. Prominent disclaimers everywhere; we link to the official source at every step.

## Disclaimer

Imm Channel is an independent informational tool, not affiliated with IRCC or the Government of Canada, and is not legal advice. Immigration rules change frequently — always verify against [canada.ca](https://www.canada.ca/en/services/immigration-citizenship.html) and consider a licensed representative (RCIC or immigration lawyer).
