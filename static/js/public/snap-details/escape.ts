const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape a string for safe interpolation into innerHTML, both as text
 * content and inside a double- or single-quoted attribute value.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Return a safe, HTML-escaped URL for use in an href. Only http(s) URLs are
 * allowed. Anything else becomes "#" so a bad URL can't run a script.
 */
export function safeUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  try {
    const { protocol } = new URL(url);
    if (protocol === "https:" || protocol === "http:") {
      return escapeHtml(url);
    }
  } catch {
    // Relative or malformed URL, so fall through to "#".
  }
  return "#";
}
