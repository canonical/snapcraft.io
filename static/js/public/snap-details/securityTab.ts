import { trackEvent } from "@canonical/analytics-events";
import { escapeHtml, safeUrl } from "./escape";
import { bindProvenanceClicks } from "./provenanceEvents";
import type { ChannelData, ChannelMapData } from "./channelMap";

interface RevisionProvenance {
  commit_sha: string;
  commit_url: string;
  build_id?: string | null;
  build_url?: string | null;
}

interface AuditableRevisionsResponse {
  github_repository: string | null;
  revisions: Record<string, RevisionProvenance>;
  error?: boolean;
}

const archBucket = (arch: string): string => {
  if (arch === "amd64" || arch === "arm64") {
    return arch;
  }
  return "other";
};

const SPINNER = '<i class="p-icon--spinner u-animation--spin">Loading</i>';
const NOT_AVAILABLE =
  '<span class="u-text-muted" aria-label="Not available">&mdash;</span>';

class SecurityTab {
  packageName: string;
  channelMapData: ChannelMapData;
  containerEl: HTMLElement;
  archSelect: HTMLSelectElement | null;
  tbody: HTMLElement | null;
  provenance: AuditableRevisionsResponse | null;
  arch: string;

  constructor(
    selectorString: string,
    packageName: string,
    channelMapData: ChannelMapData,
    defaultArch: string,
  ) {
    const containerEl = document.querySelector<HTMLElement>(selectorString);
    if (!containerEl) {
      throw new Error(`Security tab container not found: ${selectorString}`);
    }

    this.packageName = packageName;
    this.channelMapData = channelMapData;
    this.containerEl = containerEl;
    this.provenance = null;

    this.archSelect = containerEl.querySelector<HTMLSelectElement>(
      '[data-js="security-arch-select"]',
    );
    this.tbody = containerEl.querySelector<HTMLElement>(
      '[data-js="security-tab-table"]',
    );

    const architectures = Object.keys(this.channelMapData);
    this.arch = defaultArch;

    document
      .querySelector('[data-js="details-tab"][aria-controls="tab-security"]')
      ?.addEventListener("click", () =>
        trackEvent("provenance_security_tab_open"),
      );

    this.initArchSelect(architectures);
    this.renderTable();
    this.loadProvenance();
  }

  initArchSelect(architectures: string[]): void {
    if (!this.archSelect) {
      return;
    }

    this.archSelect.innerHTML = architectures
      .map(
        (arch) =>
          `<option value="${escapeHtml(arch)}">${escapeHtml(arch)}</option>`,
      )
      .join("");
    this.archSelect.value = this.arch;

    this.archSelect.addEventListener("change", (event) => {
      this.arch = (event.target as HTMLSelectElement).value;
      this.renderTable();
      trackEvent("provenance_arch_switch", { arch: archBucket(this.arch) });
    });
  }

  async loadProvenance(): Promise<void> {
    try {
      const resp = await fetch(`/api/${this.packageName}/auditable-revisions`);
      this.provenance = await resp.json();
    } catch {
      this.provenance = {
        github_repository: null,
        revisions: {},
        error: true,
      };
    }
    this.renderErrorBanner();
    this.renderTable();
  }

  renderErrorBanner(): void {
    if (!this.provenance?.error) {
      return;
    }

    const banner = document.createElement("div");
    banner.className = "p-notification--caution";
    banner.innerHTML = `
      <div class="p-notification__content">
        <p class="p-notification__message">Couldn't load build provenance right now. Please try again later.</p>
      </div>
    `;
    this.containerEl.insertBefore(banner, this.containerEl.firstChild);
  }

  getRows(): ChannelData[] {
    const archData = this.channelMapData[this.arch] || {};
    const rows: ChannelData[] = [];

    Object.keys(archData).forEach((trackName) => {
      archData[trackName].forEach((release) => {
        rows.push({ ...release, track: trackName });
      });
    });

    return rows.sort((a, b) => Number(b.revision) - Number(a.revision));
  }

  renderTable(): void {
    if (!this.tbody) {
      return;
    }

    const rows = this.getRows();

    if (rows.length === 0) {
      this.tbody.innerHTML = "";
      return;
    }

    this.tbody.innerHTML = rows.map((row) => this.renderRow(row)).join("");
    bindProvenanceClicks(this.tbody, "security-tab");
  }

  buildCells(revision: string): { build: string; commit: string } {
    if (!this.provenance) {
      return { build: SPINNER, commit: SPINNER };
    }

    const provenance = this.provenance.revisions?.[revision];
    if (!provenance) {
      return { build: NOT_AVAILABLE, commit: NOT_AVAILABLE };
    }

    const build =
      provenance.build_id && provenance.build_url
        ? `<a href="${safeUrl(provenance.build_url)}" data-js="security-build-link" rel="noopener noreferrer">LP ${escapeHtml(provenance.build_id)}</a>`
        : NOT_AVAILABLE;
    const commit = `<a href="${safeUrl(provenance.commit_url)}" data-js="security-commit-link" rel="noopener noreferrer">git ${escapeHtml(provenance.commit_sha.slice(0, 7))}</a>`;

    return { build, commit };
  }

  renderRow(row: ChannelData): string {
    const revision = row.revision;
    const channel = `${row.track}/${row.risk}`;
    const { build, commit } = this.buildCells(revision);

    return `
      <tr>
        <td>${escapeHtml(revision)}</td>
        <td>${escapeHtml(channel)}</td>
        <td>${escapeHtml(row.version)}</td>
        <td class="u-hide--small">${escapeHtml(row["released-at"] || "")}</td>
        <td>${build}</td>
        <td>${commit}</td>
      </tr>
    `;
  }
}

export default function initSecurityTab(
  selectorString: string,
  packageName: string,
  channelMapData: ChannelMapData,
  defaultArch: string,
): void {
  new SecurityTab(selectorString, packageName, channelMapData, defaultArch);
}
