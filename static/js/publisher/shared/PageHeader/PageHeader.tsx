import React from "react";
import { Strip, Tabs } from "@canonical/react-components";

type Props = {
  snapName: string;
  activeTab: string;
};

function PageHeader({ snapName, activeTab }: Props) {
  return (
    <Strip shallow={true} className="u-no-padding--bottom">
      <div className="u-fixed-width">
        <a href="/snaps">&lsaquo;&nbsp;My snaps</a>
        <h1 className="p-heading--3">{snapName}</h1>
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
