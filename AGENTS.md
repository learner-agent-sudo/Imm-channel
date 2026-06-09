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
- The sandbox blocks canada.ca — `lib/draws.ts` and the monitor fall back to
  snapshots locally; live fetches only work in production/CI.
