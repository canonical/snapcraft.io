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
 * Return an href-safe, HTML-escaped URL. Only http(s) and relative URLs are
 * allowed through; anything else collapses to "#" so publisher/recipe-controlled
 * URLs can't smuggle a script scheme into a link.
 */
export function safeUrl(value: unknown): string {
  const url = String(value ?? "").trim();
  if (/^https?:\/\//i.test(url) || url.startsWith("/")) {
    return escapeHtml(url);
  }
  return "#";
}
