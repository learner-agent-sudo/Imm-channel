<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Imm Channel — project rules

Canadian immigration pathway planner. See README.md for architecture.

- `npm test` (vitest), `npm run build`, `npm run lint` must all pass before pushing.
- **Updating policy data:** immigration rule values live ONLY in
  `lib/rules/parameters.ts`. Any change must (1) cite the official canada.ca
  source, (2) bump that entry's `lastVerified` date and `RULES_VERSION`, and
  (3) add a plain-language entry to `data/policy-updates.json`. Never change
  scoring tables in `lib/crs.ts` / `lib/fsw.ts` without updating the golden
  tests in `lib/__tests__/` from hand-computed values.
- **Privacy invariant:** user profile data never leaves the browser. Do not
  add analytics, logging, or network calls that transmit questionnaire
  answers; server code may only handle public policy/draw data.
- **i18n:** UI strings live in `lib/i18n/{en,fr,zh-hant,zh-hans}.ts`. `en.ts`
  defines the key set; the other locales are type-checked against it
  (`satisfies Dict`), so a missing key is a compile error. Adding UI text
  means adding the key to all four files. Engine-generated plan prose
  (lib/roadmap.ts, lib/special-programs.ts) is English-only by design.
- **Special programs:** nationality/status-based measures (Hong Kong streams,
  EMPP, CUAET notices) live in `lib/special-programs.ts` and follow the same
  sourcing rules as everything else. Time-limited policies must carry their
  expiry in `lib/rules/parameters.ts` (see `hkPathway.policyExpiry`).
- **Static export on GitHub Pages:** `next.config.ts` sets `output: "export"`,
  so server-only features are unavailable — route handlers that read the
  request, ISR/`revalidate`, cookies, server actions, redirects/rewrites. The
  site is served under `/<repo>/` (`PAGES_BASE_PATH` in CI): internal links
  must use `next/link`, never a raw `<a href="/...">`.
- **Draw data** lives in `data/ee-draws.json`, rewritten daily by
  `.github/workflows/site.yml` (`scripts/policy-monitor.mjs --update`). Never
  edit it by hand, and never assert its live values in tests — use
  `lib/__tests__/fixtures/draws.ts`, or a routine IRCC draw will break CI and
  block deploys.
- The sandbox blocks canada.ca, so `npm run monitor` reports feed errors
  locally; the refresh only works in GitHub Actions.
- **Security (see SECURITY.md):** a push to the default branch is live on
  GitHub Pages minutes later — never force-push it, and never commit
  secrets (the site needs none; `.npmrc` must never hold auth tokens).
  - Profile answers live only in React state: never write them to
    localStorage/sessionStorage/IndexedDB/cookies, the URL or the console.
  - Every exported page gets a strict Content-Security-Policy from
    `scripts/csp.mjs` (part of `npm run build`): hashed inline scripts only,
    `default-src 'none'`, `style-src 'self'`. Never add third-party scripts,
    fonts, analytics, iframes or remote images, inline `style=` attributes
    in server-rendered markup, or `dangerouslySetInnerHTML` — the build fails
    on inline styles, and the browser blocks the rest. Use Tailwind classes.
  - `<Link>`s whose target depends on the user's answers need
    `prefetch={false}`, or viewing the results makes answer-dependent requests.
  - Feed data is untrusted: validate it in `scripts/ircc-draws.mjs` and pass
    any feed text that goes into the issue report through `mdText`/`mdLink`
    (`scripts/feed-safety.mjs`).
  - External links in app/, components/, lib/ and data/ must be https
    canada.ca / gc.ca URLs (`lib/__tests__/official-links.test.ts`).
  - CI: keep npm-running jobs read-only, pin actions to full commit SHAs
    (with a `# vX.Y.Z` comment), keep `npm ci --ignore-scripts`, and pass
    untrusted values (`github.event.*`, feed text) to `run:` steps via
    `env:`, never inline `${{ }}`.
    `.npmrc` disables install scripts, which also skips npm pre/post hooks,
    so chain steps explicitly in package.json scripts.
