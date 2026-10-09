import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { applyCsp, buildPolicy, inlineScripts, scriptHash, verifyCsp } from "../csp.mjs";

/** A trimmed-down page in the shape `next build` exports. */
const page = (extraHead = "", body = "") =>
  `<!DOCTYPE html><html lang="en"><head><meta charSet="utf-8"/>` +
  `<meta name="viewport" content="width=device-width, initial-scale=1"/>` +
  `<link rel="stylesheet" href="/_next/static/chunks/a.css"/>` +
  `<script src="/_next/static/chunks/main.js" async=""></script>${extraHead}</head>` +
  `<body>${body}<script>(self.__next_f=self.__next_f||[]).push([0])</script>` +
  `<script>self.__next_f.push([1,"payload \\u003c/script\\u003e"])</script></body></html>`;

const sha = (text: string) =>
  `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`;

describe("inlineScripts", () => {
  it("returns inline script bodies and skips external scripts", () => {
    expect(inlineScripts(page())).toEqual([
      "(self.__next_f=self.__next_f||[]).push([0])",
      'self.__next_f.push([1,"payload \\u003c/script\\u003e"])',
    ]);
  });

  it("handles attributes, including a > inside a quoted value", () => {
    expect(inlineScripts(`<script type="a>b" id='x'>run()</script >`)).toEqual(["run()"]);
    expect(inlineScripts(`<script data-x="1" src="/x.js"></script>`)).toEqual([]);
  });
});

describe("scriptHash", () => {
  it("matches the browser's sha256 source expression", () => {
    expect(scriptHash("alert(1)")).toBe(sha("alert(1)"));
  });

  it("normalizes line endings the way the HTML parser does", () => {
    expect(scriptHash("a\r\nb\rc")).toBe(sha("a\nb\nc"));
  });
});

describe("applyCsp", () => {
  it("puts the policy straight after the charset, before any resource", () => {
    const html = applyCsp(page());
    const meta = html.indexOf('<meta http-equiv="Content-Security-Policy"');
    expect(meta).toBe(html.indexOf('<meta charSet="utf-8"/>') + '<meta charSet="utf-8"/>'.length);
    expect(meta).toBeLessThan(html.search(/<(script|link)\b/));
    expect(() => verifyCsp(html)).not.toThrow();
  });

  it("allows exactly the page's own inline scripts", () => {
    const policy = buildPolicy(page());
    const scriptSrc = policy.split("; ")[0];
    expect(scriptSrc).toBe(
      [
        "script-src 'self'",
        sha("(self.__next_f=self.__next_f||[]).push([0])"),
        sha('self.__next_f.push([1,"payload \\u003c/script\\u003e"])'),
      ].join(" "),
    );
    expect(policy).toContain("default-src 'none'");
    expect(policy).toContain("form-action 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).not.toMatch(/unsafe-inline|unsafe-eval|strict-dynamic|\*/);
  });

  it("is idempotent — a rebuilt page gets a fresh policy, not a second one", () => {
    const once = applyCsp(page());
    expect(applyCsp(once)).toBe(once);
    expect(once.match(/Content-Security-Policy/g)).toHaveLength(1);
  });

  it("refuses a page without a charset declaration to anchor to", () => {
    expect(() => applyCsp("<html><head></head><body></body></html>")).toThrow(/charSet/);
  });
});

describe("verifyCsp", () => {
  it("rejects a page whose script isn't covered", () => {
    const html = applyCsp(page()).replace("</body>", "<script>steal()</script></body>");
    expect(() => verifyCsp(html)).toThrow(/isn't covered/);
  });

  it("rejects inline styles the policy would block", () => {
    expect(() => verifyCsp(applyCsp(page("<style>body{margin:0}</style>")))).toThrow(/inline styles/);
    expect(() => verifyCsp(applyCsp(page("", '<h1 style="color:red">x</h1>')))).toThrow(
      /inline styles/,
    );
  });

  it("rejects a page without the policy", () => {
    expect(() => verifyCsp(page())).toThrow(/no Content-Security-Policy/);
  });
});
