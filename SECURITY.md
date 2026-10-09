# Security policy

Imm Channel is a static, informational site on GitHub Pages: no server, no
accounts, no database. Questionnaire answers are processed only in your
browser and are never sent anywhere — a bug that breaks that promise is the
most important thing you can report.

## Reporting a vulnerability

Report privately through GitHub: this repository's **Security** tab →
**Report a vulnerability**
(https://github.com/learner-agent-sudo/Imm-channel/security/advisories/new).
Please don't open a public issue or pull request for security problems.
Include the affected URL or file, steps to reproduce, and the impact.

This is a volunteer-run, non-commercial project. Reports are acknowledged
within 7 days and confirmed issues fixed as soon as practical, with credit in
the advisory unless you'd rather not be named. There is no bug bounty.

## Scope

**In scope:** the site at https://learner-agent-sudo.github.io/Imm-channel/
and this repository — especially anything that lets script run in a
visitor's browser (XSS, a Content-Security-Policy bypass), sends
questionnaire answers off the device, or lets someone tamper with the
published site, the Express Entry draw data, or the repository (for example
through the GitHub Actions workflow or the IRCC feed pipeline).

**Out of scope:** HTTP headers GitHub Pages can't set (X-Frame-Options,
Permissions-Policy, CSP `frame-ancestors`/reporting — the site uses a
`<meta>` policy instead); clickjacking of pages with no state-changing
actions; scanner output without a demonstrated impact; denial of service
against GitHub; social engineering. The site used to run at
imm-channel.vercel.app; that copy is retired — please tell us if anything is
still served there.

Wrong or outdated immigration information isn't a security issue: please
open a normal issue with a link to the official canada.ca source.

Only the current deployment of the default branch is supported.

## How the site is protected

- **No server, no data collection.** The questionnaire runs entirely in the
  browser; answers are never sent or stored. There are no accounts, cookies,
  analytics or third-party scripts.
- **Content-Security-Policy on every page** (`scripts/csp.mjs`, applied at
  build time): only the site's own scripts — each inline one pinned by its
  hash — can run, and the page can't load from or send data to any other
  origin. The build fails if a page has an inline style, an inline event
  handler, or an inline script that isn't Next.js page data. Note that
  GitHub Pages project sites share the `<owner>.github.io` origin, so the
  site trusts the account's other Pages sites; the account must not host
  untrusted Pages content.
- **Untrusted feed data.** IRCC feed content is fetched only over https from
  canada.ca, size-capped, validated and bounded before it's committed or
  published (`scripts/ircc-draws.mjs`), and escaped before it's posted to
  GitHub issues (`scripts/feed-safety.mjs`).
- **Least-privilege CI.** The only job that installs and runs npm packages
  has a read-only token; dependency install scripts are disabled; actions are
  pinned to commit SHAs; Dependabot proposes updates after a 7-day cooldown.
