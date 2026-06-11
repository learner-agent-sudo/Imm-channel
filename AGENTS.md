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
- The sandbox blocks canada.ca — `lib/draws.ts` and the monitor fall back to
  snapshots locally; live fetches only work in production/CI.
