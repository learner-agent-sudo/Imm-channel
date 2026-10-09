/**
 * Safety helpers for scripts/policy-monitor.mjs, which reads canada.ca feeds,
 * commits what it finds and posts a report to a GitHub issue. Everything that
 * comes from a feed is treated as untrusted — a compromised or misconfigured
 * feed must not be able to redirect the monitor elsewhere, exhaust the
 * runner, silence future reports, or put links, images, HTML, @mentions or
 * cross-repository #references into the issue. Unit-tested in
 * scripts/__tests__/feed-safety.test.ts.
 */

/** Government of Canada hosts: canada.ca, gc.ca and their subdomains. */
const OFFICIAL_HOST = /(^|\.)(canada\.ca|gc\.ca)$/i;

const ZWSP = "\u200B";

/** The URL, normalized, if it is https on an official host; otherwise null. */
export function officialUrl(value) {
  let url;
  try {
    url = new URL(String(value ?? "").trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
  return OFFICIAL_HOST.test(url.hostname) ? url.href : null;
}

/**
 * Feed text as inert markdown: renders as the same plain text, never as
 * markup, links, mentions or references. Newlines are flattened, so the text
 * also can't start a new markdown block or a runner `::command::` line.
 */
export function mdText(value, maxLength = 300) {
  let s = String(value ?? "")
    .normalize("NFKC") // folds look-alikes such as a full-width ＠ into plain ASCII
    .replace(/\p{Cf}/gu, "") // invisible format characters, incl. bidi overrides
    .replace(/[\p{Cc}\s]+/gu, " ")
    .trim();
  if (s.length > maxLength) s = `${s.slice(0, maxLength - 1)}…`;
  return (
    s
      // First, so an entity like &#64; can't decode into a live @mention.
      .replace(/&/g, "&amp;")
      // Markdown and HTML syntax, incl. table pipes and autolink brackets.
      .replace(/[\\`*_{}[\]()<>#+!|~]/g, (c) => `\\${c}`)
      // GitHub links @user mentions and #123 / GH-123 references even when
      // backslash-escaped; a zero-width space stops them.
      .replace(/@(?=[\p{L}\p{N}])/gu, `@${ZWSP}`)
      .replace(/#(?=\d)/g, `#${ZWSP}`)
      .replace(/\b(GH)-(?=\d)/gi, `$1${ZWSP}-`)
      // Bare URLs and www. hosts would be autolinked.
      .replace(/\b(https?|ftp|www)(:|\.)/gi, `$1${ZWSP}$2`)
  );
}

/** `[text](url)` when the URL is official; otherwise the text alone. */
export function mdLink(text, url) {
  const href = officialUrl(url);
  // Percent-encode parentheses so they can't end the link target early.
  return href ? `[${mdText(text)}](${href.replace(/\(/g, "%28").replace(/\)/g, "%29")})` : mdText(text);
}

/** Decodes the XML entities a feed title may contain (before mdText escapes it). */
export function decodeXmlEntities(s) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return s.replace(/&(#x[0-9a-f]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos);/gi, (m, e) => {
    if (e[0] !== "#") return named[e.toLowerCase()];
    const code = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  });
}

function elementText(block, tag) {
  const start = block.indexOf(`<${tag}`);
  if (start < 0) return "";
  const open = block.indexOf(">", start);
  const close = open < 0 ? -1 : block.indexOf(`</${tag}>`, open);
  if (close < 0) return "";
  return decodeXmlEntities(block.slice(open + 1, close).replace(/<!\[CDATA\[|\]\]>/g, "").trim());
}

function linkHref(block) {
  const start = block.indexOf("<link");
  const end = start < 0 ? -1 : block.indexOf(">", start);
  if (end < 0 || end - start > 2048) return "";
  const m = /\bhref="([^"]*)"/.exec(block.slice(start, end));
  return m ? decodeXmlEntities(m[1]) : "";
}

/**
 * Entries of an Atom feed. A linear scan rather than regexes: those take
 * quadratic time on unterminated tags, so a hostile feed could stall the job.
 */
export function parseAtomEntries(xml, maxEntries = 50) {
  const entries = [];
  let from = 0;
  while (entries.length < maxEntries) {
    const start = xml.indexOf("<entry", from);
    if (start < 0) break;
    const open = xml.indexOf(">", start);
    const close = open < 0 ? -1 : xml.indexOf("</entry>", open);
    if (close < 0) break;
    const block = xml.slice(open + 1, close);
    entries.push({
      title: elementText(block, "title"),
      updated: elementText(block, "updated") || elementText(block, "published"),
      url: linkHref(block),
    });
    from = close + "</entry>".length;
  }
  return entries;
}

/** Throws unless a response (after redirects) came over https from an expected host. */
export function assertFeedUrl(finalUrl, allowedHosts) {
  const url = new URL(finalUrl);
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) {
    throw new Error(`feed answered from unexpected location ${url.protocol}//${url.hostname}`);
  }
}

/** Reads a fetch Response body as text, aborting once it exceeds maxBytes. */
export async function readCapped(response, maxBytes) {
  const declared = Number(response.headers?.get?.("content-length"));
  if (declared > maxBytes) throw new Error(`response is ${declared} bytes (limit ${maxBytes})`);
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error(`response exceeds ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** How far ahead of the clock a news date may be (time zones, clock skew). */
export const NEWS_CLOCK_SKEW_MS = 36 * 3600_000;

/** True for a parseable date that isn't implausibly far in the future. */
export function isCurrentDate(value, now = Date.now()) {
  const t = Date.parse(value);
  return Number.isFinite(t) && t <= now + NEWS_CLOCK_SKEW_MS;
}

/**
 * The next news high-water mark. Never moves backwards, and ignores dates in
 * the future: one bogus "2099" entry would otherwise hide every real
 * announcement until then.
 */
export function nextNewsHighWater(previousIso, dates, now = Date.now()) {
  const previous = Date.parse(previousIso);
  const current = dates.filter((d) => isCurrentDate(d, now)).map((d) => Date.parse(d));
  const newest = Math.max(previous, ...current);
  return newest > previous ? new Date(newest).toISOString() : previousIso;
}
