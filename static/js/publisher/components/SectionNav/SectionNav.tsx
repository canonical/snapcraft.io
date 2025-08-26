import { Link } from "react-router-dom";
import { Tabs } from "@canonical/react-components";

import type { ElementType } from "react";

type Props = {
  activeTab: string;
  snapName: string | undefined;
};

function SectionNav({ activeTab, snapName }: Props): React.JSX.Element {
  return (
    <Tabs
      listClassName="u-no-margin--bottom"
      links={[
        {
          label: "Listing",
          active: activeTab === "listing" || !activeTab,
          to: `/${snapName}/listing`,
          component: Link as ElementType,
        },
        {
          label: "Builds",
          active: activeTab === "builds",
          to: `/${snapName}/builds`,
          component: Link as ElementType,
        },
        {
          label: "Releases",
          active: activeTab === "releases",
          to: `/${snapName}/releases`,
          component: Link as ElementType,
        },
        {
          label: "Metrics",
          active: activeTab === "metrics",
          to: `/${snapName}/metrics`,
          component: Link as ElementType,
        },
        {
          label: "Publicise",
          active: activeTab === "publicise",
          to: `/${snapName}/publicise`,
          component: Link as ElementType,
        },
        {
          label: "Settings",
          active: activeTab === "settings",
          to: `/${snapName}/settings`,
          component: Link as ElementType,
        },
      ]}
    />
  );
}

export default SectionNav;
