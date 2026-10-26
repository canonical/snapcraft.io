import { Link, resolvePath, useLocation } from "react-router-dom";
import { Tabs } from "@canonical/react-ds-global";
import type { LinkComponentProps, TabItem } from "@canonical/react-ds-global";
import routes from "./routes";

type Props = {
  disabled?: boolean;
};

// Adapts the DS's router-agnostic link contract to react-router-dom's Link.
// href is omitted for disabled tabs, in which case we render inert markup
// (mirrors the DS's own default "a" LinkComponent, which drops the href too).
function RouterLink({
  href,
  className,
  children,
  "aria-current": ariaCurrent,
}: LinkComponentProps): React.JSX.Element {
  if (href === undefined) {
    return (
      <span className={className} aria-current={ariaCurrent}>
        {children}
      </span>
    );
  }
  return (
    <Link to={href} className={className} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}

function SnapsManagementLayout({ disabled = false }: Props): React.JSX.Element {
  const { pathname } = useLocation();
  const tabsRoutes = routes.find((r) => r.path === ":snapId")?.children ?? [];
  const items: TabItem[] = tabsRoutes.map(({ label, path }) => ({
    key: path,
    label,
    url: resolvePath(path, "./").pathname,
    disabled,
  }));
  const pathSegments = pathname.split("/");
  const currentUrl = disabled
    ? undefined
    : items.find((_, index) => pathSegments.includes(tabsRoutes[index].path))
        ?.url;

  return (
    <Tabs
      aria-label="Snap management"
      listClassName="u-no-margin--bottom"
      navigationRoot={{ key: "snap-management-tabs", items }}
      currentUrl={currentUrl}
      LinkComponent={RouterLink}
    />
  );
}

export default SnapsManagementLayout;
