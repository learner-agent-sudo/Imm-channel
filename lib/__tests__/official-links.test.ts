import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { officialUrl } from "@/scripts/feed-safety.mjs";

/**
 * Every external link the site shows ("Official source ↗", guide steps,
 * policy updates) must be an https link to a Government of Canada site.
 * These files are edited by hand on each policy update, so this catches a
 * typo'd http:// link or a look-alike domain before it ships.
 */
const ROOT = join(__dirname, "..", "..");
const SOURCES = ["app", "components", "lib", "data"];

/** Non-government links that are deliberately there (not policy sources). */
const OTHER_ALLOWED = new Set([
  // Methodology page: the host's privacy statement.
  "https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement",
]);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__tests__" ? [] : files(path);
    return /\.(tsx?|json)$/.test(entry.name) ? [path] : [];
  });
}

describe("external links", () => {
  const links = SOURCES.flatMap((dir) => files(join(ROOT, dir))).flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(/https?:\/\/[^\s"'`)<>\\]+/g)].map((m) => ({
      file: file.slice(ROOT.length + 1),
      url: m[0],
    })),
  );

  it("finds the site's links", () => {
    expect(links.length).toBeGreaterThan(10);
  });

  it("are all https links to canada.ca or gc.ca", () => {
    const bad = links.filter(({ url }) => officialUrl(url) === null && !OTHER_ALLOWED.has(url));
    expect(bad).toEqual([]);
  });
});
