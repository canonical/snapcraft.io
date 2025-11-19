import { Link, resolvePath, useLocation } from "react-router-dom";
import { Tabs } from "@canonical/react-components";
import routes from "./routes";

function SnapsManagementLayout(): React.JSX.Element {
  const { pathname } = useLocation();
  const tabsRoutes = routes.find((r) => r.path === ":snapId")?.children ?? [];
  const tabsLinks = tabsRoutes.map(({ label, path }) => ({
    label,
    active: pathname.includes(`/${path}`),
    to: resolvePath(path, "./"),
    component: Link,
  }));

  return <Tabs listClassName="u-no-margin--bottom" links={tabsLinks} />;
}

export default SnapsManagementLayout;
