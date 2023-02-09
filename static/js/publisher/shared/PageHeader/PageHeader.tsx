import React from "react";
import { Strip, Tabs } from "@canonical/react-components";

type Props = {
  snapName: string;
  activeTab: string;
  publisherName?: string;
};

function PageHeader({ snapName, activeTab, publisherName }: Props) {
  return (
    <Strip shallow={true} className="u-no-padding--bottom">
      <div className="u-fixed-width">
        <a href="/snaps">&lsaquo;&nbsp;My snaps</a>
        <div className="u-flex" style={{ alignItems: "baseline" }}>
          <h1 className="p-heading--3">{snapName}</h1>
          {publisherName && (
            <p
              className="u-text-muted u-no-margin--bottom"
              style={{ marginLeft: "0.5rem" }}
            >
              by {publisherName}
            </p>
          )}
        </div>
        <Tabs
          listClassName="u-no-margin--bottom"
          links={[
            {
              label: "Listing",
              active: activeTab === "listing",
              href: `/${snapName}/listing`,
              "data-tour": "listing-intro",
            },
            {
              label: "Builds",
              active: activeTab === "builds",
              href: `/${snapName}/builds`,
            },
            {
              label: "Releases",
              active: activeTab === "releases",
              href: `/${snapName}/releases`,
            },
            {
              label: "Metrics",
              active: activeTab === "metrics",
              href: `/${snapName}/metrics`,
            },
            {
              label: "Publicise",
              active: activeTab === "publicise",
              href: `/${snapName}/publicise`,
            },
            {
              label: "Settings",
              active: activeTab === "settings",
              href: `/${snapName}/settings`,
            },
          ]}
        />
      </div>
    </Strip>
  );
}

export default PageHeader;
