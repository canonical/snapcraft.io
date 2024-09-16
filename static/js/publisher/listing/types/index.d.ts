declare global {
  interface Window {
    SENTRY_DSN: string;
    CSRF_TOKEN: string;
    listingData: any;
    tourSteps: any;
  }
}

export type Step = {
  id: string;
  position?: string;
  elements?: HTMLElement[];
  title: string;
  content: string;
};

export type Data = {
  snap_id: string;
  title: string;
  video_urls: string;
  summary: string;
  description: string;
  categories: { name: string; slug: string }[];
  primary_category: string;
  secondary_category: string;
  websites: { url: string }[];
  contacts: { url: string }[];
  donations: { url: string }[];
  source_code: { url: string }[];
  issues: { url: string }[];
  primary_website: string;
  public_metrics_enabled: boolean;
  public_metrics_blacklist: string[];
  public_metrics_territories: boolean;
  public_metrics_distros: boolean;
  license: string;
  license_type: string;
  licenses: { key: string; name: string }[];
  icon_url: string;
  screenshot_urls: string[];
  banner_urls: string[];
  update_metadata_on_release: boolean;
  tour_steps: Step[];
};
