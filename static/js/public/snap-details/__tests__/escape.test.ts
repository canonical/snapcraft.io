import { escapeHtml, safeUrl } from "../escape";

describe("escapeHtml", () => {
  it("escapes HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x" & 'y'>`)).toBe(
      "&lt;a href=&quot;x&quot; &amp; &#39;y&#39;&gt;",
    );
  });

  it("coerces nullish input to an empty string", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("safeUrl", () => {
  it("allows absolute http(s) URLs", () => {
    expect(safeUrl("https://github.com/x/y/commit/abc")).toBe(
      "https://github.com/x/y/commit/abc",
    );
    expect(safeUrl("http://launchpad.net/~x/+snap/y/+build/1")).toBe(
      "http://launchpad.net/~x/+snap/y/+build/1",
    );
  });

  it("HTML-escapes the allowed URL", () => {
    expect(safeUrl('https://example.com/?a="b"&c=<d>')).toBe(
      "https://example.com/?a=&quot;b&quot;&amp;c=&lt;d&gt;",
    );
  });

  it("trims surrounding whitespace before validating", () => {
    expect(safeUrl("  https://example.com/  ")).toBe("https://example.com/");
  });

  it("rejects script and data schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBe("#");
    expect(safeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
  });

  it("rejects protocol-relative URLs (open-redirect vector)", () => {
    expect(safeUrl("//evil.com/path")).toBe("#");
  });

  it("rejects relative and malformed URLs", () => {
    expect(safeUrl("/relative/path")).toBe("#");
    expect(safeUrl("not a url")).toBe("#");
    expect(safeUrl("")).toBe("#");
    expect(safeUrl(null)).toBe("#");
  });
});
