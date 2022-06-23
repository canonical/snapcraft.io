import React from "react";
import { Strip, Tabs } from "@canonical/react-components";

type Props = {
  snapName: string;
};

function PageHeader({ snapName }: Props) {
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
              active: true,
              href: `/${snapName}/listing`,
              "data-tour": "listing-intro",
            },
            {
              label: "Builds",
              href: `/${snapName}/builds`,
            },
            {
              label: "Releases",
              href: `/${snapName}/releases`,
            },
            {
              label: "Metrics",
              href: `/${snapName}/metrics`,
            },
            {
              label: "Publicise",
              href: `/${snapName}/publicise`,
            },
            {
              label: "Settings",
              href: `/${snapName}/settings`,
            },
          ]}
        />
      </div>
    </Strip>
  );
}

export default PageHeader;
