import { trackEvent } from "@canonical/analytics-events";
import { escapeHtml, safeUrl } from "./escape";
import { bindProvenanceClicks } from "./provenanceEvents";

type BadgeState = "verified" | "unavailable" | "not-provided" | "error";

interface AuditableResponse {
  auditable: boolean;
  status?: BadgeState;
  revision?: number;
  architecture?: string;
  commit_sha?: string;
  github_repository?: string | null;
  commit_url?: string;
  build_id?: string | null;
  build_url?: string | null;
}

const MESSAGES: Record<
  Exclude<BadgeState, "verified">,
  { dataJs: string; html: string }
> = {
  error: {
    dataJs: "auditable-badge-error",
    html: `<span class="p-auditable-badge__error">Couldn't load provenance right now</span>`,
  },
  unavailable: {
    dataJs: "auditable-badge-unavailable",
    html: "Build provenance unavailable for this revision",
  },
  "not-provided": {
    dataJs: "auditable-badge-not-provided",
    html: `<span class="p-auditable-badge__note">No public provenance for this revision</span>`,
  },
};

const revArchPrefix = (data?: AuditableResponse): string =>
  data?.revision && data?.architecture
    ? `<span class="u-text-muted">rev${escapeHtml(data.revision)}/${escapeHtml(data.architecture)}</span> `
    : "";

function renderLoading(el: HTMLElement): void {
  el.innerHTML = `
    <div class="p-auditable-skeleton" data-js="auditable-badge-loading"
         role="status" aria-label="Loading build provenance">
      <span class="p-auditable-skeleton__bar p-auditable-skeleton__bar--short"></span>
      <span class="p-auditable-skeleton__bar p-auditable-skeleton__bar--long"></span>
    </div>
  `;
}

function renderMessage(
  el: HTMLElement,
  state: Exclude<BadgeState, "verified">,
  data?: AuditableResponse,
): void {
  const { dataJs, html } = MESSAGES[state];
  el.innerHTML = `
    <p class="u-text-muted u-no-margin--bottom" data-js="${dataJs}">
      ${revArchPrefix(data)}${html}
    </p>
  `;
}

function renderVerified(el: HTMLElement, data: AuditableResponse): void {
  const commit = data.commit_sha ? escapeHtml(data.commit_sha.slice(0, 7)) : "";
  let buildLabel = "Launchpad build";
  if (data.build_id) {
    buildLabel = data.build_url
      ? `Launchpad build <a href="${safeUrl(data.build_url)}" data-js="auditable-build-link" rel="noopener noreferrer">${escapeHtml(data.build_id)}</a>`
      : `Launchpad build ${escapeHtml(data.build_id)}`;
  }

  const message = `${buildLabel} from commit <a href="${safeUrl(data.commit_url)}" data-js="auditable-commit-link" rel="noopener noreferrer">${commit}</a>`;

  el.innerHTML = `
    <p class="p-auditable-badge u-no-margin--bottom" data-js="auditable-badge-content">
      <span class="u-text-muted">rev${escapeHtml(data.revision)}/${escapeHtml(data.architecture)}</span>
      <i class="p-icon--success"></i>
      <span>${message}</span>
    </p>
  `;

  bindProvenanceClicks(el, "badge");
}

async function loadBadge(el: HTMLElement, snapName: string): Promise<void> {
  let state: BadgeState;

  renderLoading(el);

  try {
    const resp = await fetch(`/api/${snapName}/auditable`);
    const data: AuditableResponse = await resp.json();
    state = data.status ?? "not-provided";

    if (state === "verified") {
      renderVerified(el, data);
    } else {
      renderMessage(el, state, data);
    }
  } catch {
    state = "error";
    renderMessage(el, state);
  }

  trackEvent("provenance_badge_shown", { state });
}

export default function initAuditableBadge(
  selector = '[data-js="auditable-badge"]',
): void {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    return;
  }

  const snapName = el.dataset.snapName;
  if (!snapName) {
    return;
  }

  loadBadge(el, snapName);
}
