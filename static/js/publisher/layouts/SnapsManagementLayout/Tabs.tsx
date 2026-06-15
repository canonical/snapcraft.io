import { Link, resolvePath, useLocation } from "react-router-dom";
import { Tabs } from "@canonical/react-components";
import routes from "./routes";

type Props = {
  disabled?: boolean;
};

function SnapsManagementLayout({ disabled = false }: Props): React.JSX.Element {
  const { pathname } = useLocation();
  const tabsRoutes = routes.find((r) => r.path === ":snapId")?.children ?? [];
  const tabsLinks = tabsRoutes.map(({ label, path }) => {
    if (disabled) {
      return {
        label,
        active: false,
        "aria-disabled": true,
        onClick: (event: React.MouseEvent) => event.preventDefault(),
        style: { pointerEvents: "none" as const, opacity: 0.5 },
      };
    }
    return {
      label,
      active: pathname.includes(`/${path}`),
      to: resolvePath(path, "./"),
      component: Link,
    };
  });

  return <Tabs listClassName="u-no-margin--bottom" links={tabsLinks} />;
}

export default SnapsManagementLayout;
