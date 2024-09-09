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
  );
}

export default SectionNav;
