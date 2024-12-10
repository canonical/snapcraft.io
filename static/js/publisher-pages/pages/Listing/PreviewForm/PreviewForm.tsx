import { UseFormGetValues, FieldValues } from "react-hook-form";
import { Form } from "@canonical/react-components";

type Props = {
  snapName: string;
  getValues: UseFormGetValues<FieldValues>;
};

type ListingData = {
  categories: { name: string; slug: string }[];
  links: {
    website: Array<string>;
    contact: Array<string>;
    donations: Array<string>;
    source: Array<string>;
    issues: Array<string>;
  };
  snap_name: string;
  title: string;
  images: Array<{
    url: string;
    type: string;
    status: string;
  }>;
  summary: string;
  description: string;
};

function PreviewForm({ snapName, getValues }: Props) {
  const listingData: ListingData = {
    categories: [],
    links: {
      website: getValues("websites").map((item: { url: string }) => item.url),
      contact: getValues("contacts").map((item: { url: string }) => item.url),
      donations: getValues("donations").map(
        (item: { url: string }) => item.url,
      ),
      source: getValues("source_code").map((item: { url: string }) => item.url),
      issues: getValues("issues").map((item: { url: string }) => item.url),
    },
    snap_name: snapName,
    title: getValues("title"),
    images: [
      {
        url: getValues("banner_url"),
        type: "banner",
        status: "uploaded",
      },
      {
        url: getValues("icon_url"),
        type: "icon",
        status: "uploaded",
      },
    ],
    summary: getValues("summary"),
    description: getValues("description"),
  };

  const screenshotUrls = getValues("screenshot_urls");

  if (screenshotUrls.length) {
    screenshotUrls.forEach((screenshotUrl: string) => {
      listingData.images.push({
        url: screenshotUrl,
        type: "screenshot",
        status: "uploaded",
      });
    });
  }

  const primaryCategory = getValues("primary_category");
  const secondaryCategory = getValues("secondary_category");

  if (primaryCategory) {
    listingData.categories.push({
      name: primaryCategory,
      slug: primaryCategory,
    });
  }

  if (secondaryCategory) {
    listingData.categories.push({
      name: secondaryCategory,
      slug: secondaryCategory,
    });
  }

  window.localStorage.setItem(
    `${snapName}-initial`,
    JSON.stringify(listingData),
  );

  window.localStorage.setItem(snapName, JSON.stringify(listingData));

  return (
    <Form
      id="preview-form"
      action={`/${snapName}/preview`}
      method="POST"
      encType="multipart/form-data"
      className="u-hide"
      target="_blank"
      rel="opener"
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
