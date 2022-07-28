const formatLinkFields = (fields: Array<{ url: string }>) => {
  return fields.map((item) => item.url);
};

function getFormData(
  data: { [key: string]: any },
  snapId: string,
  changes: { [key: string]: any }
) {
  const formData = new FormData();

  formData.set("csrf_token", window.CSRF_TOKEN);
  formData.set("snap_id", snapId);
  formData.set("title", data?.title);
  formData.set("summary", data?.summary);
  formData.set("description", data?.description);
  formData.set("video_urls", data?.video_urls);
  formData.set("website", data?.website);
  formData.set("contact", data?.contact);
  formData.set("primary-category", data?.["primary-category"]);
  formData.set("secondary-category", data?.["secondary-category"]);
  formData.set("public_metrics_enabled", data?.public_metrics_enabled);
  formData.set("public_metrics_blacklist", data?.public_metrics_blacklist);
  formData.set("license", data?.license || "unset");
  formData.set("images", data?.["images"]);
  formData.set(
    "links",
    JSON.stringify({
      contact: formatLinkFields(data?.contacts),
      donation: formatLinkFields(data?.donations),
      issues: formatLinkFields(data?.issues),
      "source-code": formatLinkFields(data?.["source-code"]),
      website: formatLinkFields(data?.websites),
    })
  );
  formData.set("changes", JSON.stringify(changes));

  if (data?.icon) {
    formData.append("icon", data?.icon[0]);
  }

  return formData;
}

export default getFormData;
