import React from "react";
import { Form } from "@canonical/react-components";

type Link = Array<{ url: string }>;

type Props = {
  listingData: {
    snap_name: string;
    title: string;
    summary: string;
    description: string;
    website: string;
    contact: string;
    categories: Array<{ name: string; slug: string }>;
    public_metrics_enabled: boolean;
    public_metrics_blacklist: Array<string>;
    license: boolean;
    video_urls: string;
    snap_categories: Array<string>;
    websites: Link;
    "source-code": Link;
    donations: Link;
    issues: Link;
    contacts: Link;
    links: {
      website: Array<string>;
      contact: Array<string>;
      donations: Array<string>;
      source: Array<string>;
      issues: Array<string>;
    };
  };
};

function PreviewForm({ listingData }: Props) {
  const primaryCategory = listingData?.categories.find((category) => {
    return category.slug === listingData?.snap_categories[0];
  });

  const secondaryCategory = listingData?.categories.find((category) => {
    return category.slug === listingData?.snap_categories[1];
  });

  listingData.categories = [];

  if (primaryCategory) {
    listingData.categories.push(primaryCategory);
  }

  if (secondaryCategory) {
    listingData.categories.push(secondaryCategory);
  }

  listingData.links = {
    website: listingData.websites.map((url) => url.url),
    contact: listingData.contacts.map((url) => url.url),
    donations: listingData.donations.map((url) => url.url),
    source: listingData["source-code"].map((url) => url.url),
    issues: listingData.issues.map((url) => url.url),
  };

  return (
    <Form
      id="preview-form"
      action={`/${listingData?.snap_name}/preview`}
      method="POST"
      encType="multipart/form-data"
      className="u-hide"
      target="_blank"
    >
      <input type="hidden" name="csrf_token" defaultValue={window.CSRF_TOKEN} />
      <input
        type="hidden"
        name="state"
        defaultValue={JSON.stringify(listingData)}
      />
    </Form>
  );
}

export default PreviewForm;
