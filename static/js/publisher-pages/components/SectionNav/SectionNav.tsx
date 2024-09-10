import { Link } from "react-router-dom";
import { Tabs } from "@canonical/react-components";

type Props = {
  activeTab: string;
  snapName: string | undefined;
};

function SectionNav({ activeTab, snapName }: Props) {
  return (
    <Tabs
      links={[
        {
          label: "Listing",
          active: activeTab === "listing" || !activeTab,
          to: `/${snapName}/listing`,
          component: Link,
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
          to: `/${snapName}/publicise`,
          component: Link,
        },
        {
          label: "Settings",
          active: activeTab === "settings",
          to: `/${snapName}/settings`,
          component: Link,
        },
      ]}
    />
  );
}

export default SectionNav;
