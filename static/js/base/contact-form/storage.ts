// sessionStorage can be blocked or full; never let that break the form

export function readJSON(key: string, label: string): Record<string, unknown> {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (error) {
    console.warn(`Failed to read ${label}`, error);
    return {};
  }
}

export function writeJSON(key: string, value: unknown, label: string): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${label}`, error);
  }
}

export function removeItem(key: string, label: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Failed to remove ${label}`, error);
  }
}
