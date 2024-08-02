function getDefaultValues(data: any) {
  return {
    title: data.title || "",
    icon_url: data.icon_url || "",
    icon: data.icon,
    screenshots: data.screenshots,
    screenshot_urls: data.screenshot_urls,
    banner_url: data.banner_url || "",
    banner: data.banner,
    "primary-category": data["primary-category"] || "",
    "secondary-category": data["secondary-category"] || "",
    video_urls: data.video_urls || "",
    summary: data.summary || "",
    description: data.description || "",
    primary_website: data.primary_website || "",
    websites: data.websites,
    contacts: data.contacts,
    donations: data.donations,
    "source-code": data["source-code"],
    issues: data.issues,
    license: data.license,
    public_metrics_enabled: data.public_metrics_enabled,
    public_metrics_territories: data.public_metrics_territories,
    public_metrics_distros: data.public_metrics_distros,
    public_metrics_blacklist: data.public_metrics_blacklist,
  };
}

export default getDefaultValues;
