import { Link } from "react-router-dom";
import { Tabs } from "@canonical/react-components";

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
          component: Link,
        },
        {
          label: "Builds",
          active: activeTab === "builds",
          to: `/${snapName}/builds`,
          component: Link,
        },
        {
          label: "Releases",
          active: activeTab === "releases",
          to: `/${snapName}/releases`,
          component: Link,
        },
        {
          label: "Metrics",
          active: activeTab === "metrics",
          to: `/${snapName}/metrics`,
          component: Link,
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
