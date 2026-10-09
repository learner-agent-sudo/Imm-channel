import { describe, expect, it } from "vitest";
import {
  assertFeedUrl,
  decodeXmlEntities,
  mdLink,
  mdText,
  nextNewsHighWater,
  officialUrl,
  parseAtomEntries,
  readCapped,
} from "../feed-safety.mjs";

const ZWSP = "\u200B";

describe("mdText", () => {
  it("leaves ordinary titles readable", () => {
    expect(mdText("Canada welcomes 485,000 newcomers in 2026")).toBe(
      "Canada welcomes 485,000 newcomers in 2026",
    );
  });

  it("escapes markdown and HTML syntax", () => {
    expect(mdText("![x](https://evil.example/p.png)")).not.toMatch(/(^|[^\\])!\[/);
    expect(mdText("<img src=x onerror=alert(1)>")).toContain("\\<img");
    expect(mdText("a | b")).toBe("a \\| b");
    expect(mdText("**bold** _it_ `code`")).toBe("\\*\\*bold\\*\\* \\_it\\_ \\`code\\`");
  });

  it("neutralizes @mentions and issue references, including entity-encoded ones", () => {
    expect(mdText("cc @octocat")).toBe(`cc @${ZWSP}octocat`);
    expect(mdText("cc ＠octocat")).toBe(`cc @${ZWSP}octocat`); // full-width @
    expect(mdText("see #12 and GH-3")).toBe(`see \\#${ZWSP}12 and GH${ZWSP}-3`);
    // Renders as the literal text "&#64;octocat", not as a mention.
    expect(mdText("cc &#64;octocat")).toBe(`cc &amp;\\#${ZWSP}64;octocat`);
  });

  it("stops bare URLs and emails from autolinking, wherever they start", () => {
    for (const s of ["visit https://evil.example", "_https://e.x", "1https://e.x", "_HTTPS://e.x", "x_ftp://e.x"]) {
      expect(mdText(s), s).not.toMatch(/(https?|ftp):/i);
    }
    for (const s of ["www.evil.example", "_www.evil.example"]) {
      expect(mdText(s), s).not.toContain("www.");
    }
    expect(mdText("a@.b.co")).toBe(`a@${ZWSP}.b.co`);
  });

  it("flattens newlines and control characters, so no new block or runner command can start", () => {
    expect(mdText("line one\n# heading\r\n- item\u2028x")).toBe("line one \\# heading - item x");
    expect(mdText("ok\n::error::spoofed")).toBe("ok ::error::spoofed");
  });

  it("drops invisible format characters such as bidi overrides", () => {
    expect(mdText("abc\u202Edef\u200Bghi")).toBe("abcdefghi");
  });

  it("caps length", () => {
    const s = mdText("x".repeat(1000), 50);
    expect(s).toHaveLength(50);
    expect(s.endsWith("…")).toBe(true);
  });

  it("handles missing values", () => {
    expect(mdText(undefined)).toBe("");
    expect(mdText(null)).toBe("");
  });
});

describe("officialUrl", () => {
  it("accepts https Government of Canada URLs", () => {
    const news = "https://www.canada.ca/en/immigration-refugees-citizenship/news/2026/06/x.html";
    expect(officialUrl(news)).toBe(news);
    expect(officialUrl("https://laws-lois.justice.gc.ca/eng/")).toBe("https://laws-lois.justice.gc.ca/eng/");
  });

  it("rejects other schemes, hosts, look-alikes, credentials and ports", () => {
    for (const bad of [
      "javascript:alert(1)",
      "http://www.canada.ca/",
      "https://evil.example/",
      "https://www.canada.ca.evil.example/",
      "https://evilcanada.ca/",
      "https://user:pw@www.canada.ca/",
      "https://www.canada.ca:8443/",
      "data:text/html,hi",
      "not a url",
      "",
    ]) {
      expect(officialUrl(bad), bad).toBeNull();
    }
  });
});

describe("mdLink", () => {
  it("links official URLs and drops the link otherwise", () => {
    expect(mdLink("News", "https://www.canada.ca/n.html")).toBe("[News](https://www.canada.ca/n.html)");
    expect(mdLink("News", "https://evil.example/")).toBe("News");
  });

  it("encodes parentheses so the link target can't be cut short", () => {
    expect(mdLink("x", "https://www.canada.ca/a_(b).html")).toBe(
      "[x](https://www.canada.ca/a_%28b%29.html)",
    );
  });

  it("can't spell an Actions runner command in the URL", () => {
    expect(mdLink("t", "https://www.canada.ca/#a##[error]x")).not.toContain("##[");
    expect(mdLink("t", "https://www.canada.ca/a?b=\\c")).toContain("%5C");
  });

  it("drops absurdly long links", () => {
    expect(mdLink("t", `https://www.canada.ca/${"a".repeat(2000)}`)).toBe("t");
  });
});

describe("decodeXmlEntities", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeXmlEntities("Q&amp;A &lt;b&gt; &#39;x&#x27; &quot;")).toBe(`Q&A <b> 'x' "`);
  });

  it("leaves unknown or out-of-range entities alone", () => {
    expect(decodeXmlEntities("&nbsp; &#0; &#x110000;")).toBe("&nbsp; &#0; &#x110000;");
  });
});

describe("parseAtomEntries", () => {
  const feed = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>IRCC</title>
    <entry><title><![CDATA[Express Entry: new category]]></title>
      <link rel="alternate" href="https://www.canada.ca/en/news/a.html"/>
      <updated>2026-09-01T12:00:00-04:00</updated></entry>
    <entry><title>Q&amp;A on study permits</title><link href="https://www.canada.ca/en/news/b.html"/>
      <published>2026-08-15T09:00:00Z</published></entry>
  </feed>`;

  it("reads title, date and link from each entry", () => {
    expect(parseAtomEntries(feed)).toEqual([
      {
        title: "Express Entry: new category",
        updated: "2026-09-01T12:00:00-04:00",
        url: "https://www.canada.ca/en/news/a.html",
      },
      { title: "Q&A on study permits", updated: "2026-08-15T09:00:00Z", url: "https://www.canada.ca/en/news/b.html" },
    ]);
  });

  it("prefers the alternate link over other rels", () => {
    const xml = `<feed><entry><title>t</title><link rel="self" href="https://www.canada.ca/feed"/>
      <link rel="alternate" type="text/html" href="https://www.canada.ca/a.html"/></entry></feed>`;
    expect(parseAtomEntries(xml)[0].url).toBe("https://www.canada.ca/a.html");
  });

  it("caps the number of entries", () => {
    const many = "<feed>" + "<entry><title>t</title></entry>".repeat(500) + "</feed>";
    expect(parseAtomEntries(many, 50)).toHaveLength(50);
  });

  it("stays fast on hostile, unterminated markup", () => {
    const started = performance.now();
    parseAtomEntries("<entry>".repeat(200_000));
    parseAtomEntries("<entry>" + "<link".repeat(200_000) + "</entry>");
    parseAtomEntries("<entry><link" + "x".repeat(2_000_000) + "</entry>");
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe("assertFeedUrl", () => {
  const hosts = ["www.canada.ca", "api.io.canada.ca"];

  it("accepts the expected hosts over https", () => {
    expect(() => assertFeedUrl("https://www.canada.ca/x.json", hosts)).not.toThrow();
  });

  it("rejects redirects to other hosts or to plain http", () => {
    expect(() => assertFeedUrl("https://evil.example/x.json", hosts)).toThrow(/unexpected/);
    expect(() => assertFeedUrl("http://www.canada.ca/x.json", hosts)).toThrow(/unexpected/);
    expect(() => assertFeedUrl("https://canada.ca/x.json", hosts)).toThrow(/unexpected/);
  });
});

describe("readCapped", () => {
  it("returns bodies within the limit", async () => {
    expect(await readCapped(new Response("hello"), 10)).toBe("hello");
  });

  it("aborts bodies over the limit, declared or not", async () => {
    await expect(readCapped(new Response("x".repeat(100)), 10)).rejects.toThrow(/exceeds/);
    const declared = new Response("x", { headers: { "content-length": "999999" } });
    await expect(readCapped(declared, 10)).rejects.toThrow(/limit/);
  });

  it("decodes multi-byte text split across chunks", async () => {
    const bytes = new TextEncoder().encode("加拿大 — ok");
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 2));
        controller.enqueue(bytes.slice(2));
        controller.close();
      },
    });
    expect(await readCapped(new Response(body), 100)).toBe("加拿大 — ok");
  });
});

describe("nextNewsHighWater", () => {
  const now = Date.parse("2026-10-01T00:00:00Z");

  it("advances to the newest current date", () => {
    expect(
      nextNewsHighWater("2026-06-01T00:00:00.000Z", ["2026-09-01T12:00:00Z", "2026-08-01T00:00:00Z"], now),
    ).toBe("2026-09-01T12:00:00.000Z");
  });

  it("ignores future and unparseable dates, so one bogus entry can't hide later news", () => {
    expect(
      nextNewsHighWater("2026-06-01T00:00:00.000Z", ["2099-01-01T00:00:00Z", "not a date", ""], now),
    ).toBe("2026-06-01T00:00:00.000Z");
  });

  it("recovers from a corrupted previous value instead of stalling", () => {
    expect(nextNewsHighWater("garbage", ["2026-09-01T12:00:00Z"], now)).toBe("2026-09-01T12:00:00.000Z");
  });

  it("returns the previous value unchanged when nothing is newer", () => {
    expect(nextNewsHighWater("2026-06-01T00:00:00Z", ["2026-05-01T00:00:00Z"], now)).toBe(
      "2026-06-01T00:00:00Z",
    );
  });

  it("never moves backwards", () => {
    expect(nextNewsHighWater("2026-09-15T00:00:00.000Z", ["2026-08-01T00:00:00Z"], now)).toBe(
      "2026-09-15T00:00:00.000Z",
    );
  });
});
