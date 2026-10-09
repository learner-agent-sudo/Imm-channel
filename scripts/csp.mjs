#!/usr/bin/env node
/**
 * Post-build step (part of `npm run build`): adds a strict
 * Content-Security-Policy to every exported page in out/.
 *
 * GitHub Pages can't send response headers, so the policy lives in a
 * <meta http-equiv> tag. Next.js inlines its page data as <script> blocks,
 * so instead of allowing inline scripts wholesale this hashes each one and
 * allows exactly those. Injected markup (an XSS bug, a compromised dependency
 * adding a <script>) has no matching hash and won't run, and nothing on the
 * page can load from — or send questionnaire answers to — another origin.
 *
 * Hashes change on every build (chunk names) and every draw refresh (pages
 * embed the draw data), which is why this runs after each build rather than
 * living in source. It fails the build if any page can't be fully covered —
 * e.g. if a Next.js upgrade starts emitting inline styles — so a policy that
 * would silently break the site never ships.
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// An HTML <script> element: the body ends at the first "</script" (the HTML
// tokenizer doesn't care about JS strings), optionally followed by space or /.
const SCRIPT_RE = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script[\s/]*>/gi;
const CSP_META_RE = /<meta http-equiv="Content-Security-Policy"[^>]*>/i;

/**
 * Everything except script-src. Not settable from a meta tag, so absent:
 * frame-ancestors, report-uri/report-to (reporting would also be a network
 * call), sandbox. Deliberately absent: 'strict-dynamic' (it would block
 * Next's <script src> chunk tags) and upgrade-insecure-requests (Pages is
 * HTTPS-only already, and it breaks a local http preview).
 */
export const BASE_DIRECTIVES = [
  "default-src 'none'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  // Client-side navigation fetches the next page's data from this origin.
  "connect-src 'self'",
  "base-uri 'none'",
  // The planner never submits a form, so a native submission (e.g. Enter
  // pressed before the page has loaded) can't put answers into a URL.
  "form-action 'none'",
];

/** Bodies of the page's inline <script> elements (external scripts excluded). */
export function inlineScripts(html) {
  const bodies = [];
  for (const m of html.matchAll(SCRIPT_RE)) {
    if (!/(^|\s)src\s*=/i.test(m[1])) bodies.push(m[2]);
  }
  return bodies;
}

/** The CSP source expression a browser computes for an inline script. */
export function scriptHash(body) {
  // The HTML parser turns CRLF and lone CR into LF before the script exists.
  const text = body.replace(/\r\n?/g, "\n");
  return `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;
}

export function buildPolicy(html) {
  const hashes = [...new Set(inlineScripts(html).map(scriptHash))];
  return [["script-src 'self'", ...hashes].join(" "), ...BASE_DIRECTIVES].join("; ");
}

/** Markup the policy would block: inline <style> blocks and style="" attributes. */
export function inlineStyles(html) {
  const withoutScripts = html.replace(SCRIPT_RE, "");
  return [
    ...withoutScripts.matchAll(/<style\b[^>]*>/gi),
    ...withoutScripts.matchAll(/<[a-z][^>]*\sstyle\s*=/gi),
  ].map((m) => m[0].slice(0, 60));
}

/**
 * Inserts (or refreshes) the CSP meta tag. A meta policy only governs what
 * the parser meets after it, so it goes straight after the charset
 * declaration, before every <link> and <script>.
 */
export function applyCsp(html) {
  const page = html.replace(CSP_META_RE, "");
  const tag = `<meta http-equiv="Content-Security-Policy" content="${buildPolicy(page)}"/>`;
  const anchor = page.match(/<meta charSet="utf-8"\s*\/?>/i);
  if (!anchor) throw new Error('no <meta charSet="utf-8"/> to anchor the policy after');
  return page.replace(anchor[0], () => anchor[0] + tag);
}

/** Throws unless the policy comes first and covers everything on the page. */
export function verifyCsp(html) {
  const meta = html.match(CSP_META_RE);
  if (!meta) throw new Error("no Content-Security-Policy meta tag");
  const firstResource = html.search(/<(script|link|style)\b/i);
  if (firstResource !== -1 && firstResource < meta.index) {
    throw new Error("the policy comes after a script, link or style");
  }
  for (const body of inlineScripts(html)) {
    if (!meta[0].includes(scriptHash(body))) throw new Error("an inline script isn't covered");
  }
  const styles = inlineStyles(html);
  if (styles.length > 0) {
    throw new Error(`inline styles would be blocked by style-src 'self': ${styles.join(", ")}`);
  }
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith(".html") ? [path] : [];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "out");
  const files = htmlFiles(outDir);
  if (files.length === 0) throw new Error(`no HTML files in ${outDir} — run next build first`);
  let hashed = 0;
  for (const file of files) {
    try {
      const html = applyCsp(readFileSync(file, "utf8"));
      verifyCsp(html);
      writeFileSync(file, html);
      hashed += inlineScripts(html).length;
    } catch (err) {
      throw new Error(`CSP: ${relative(outDir, file)}: ${err.message}`);
    }
  }
  console.log(`CSP: added to ${files.length} pages (${hashed} inline scripts hashed).`);
}
