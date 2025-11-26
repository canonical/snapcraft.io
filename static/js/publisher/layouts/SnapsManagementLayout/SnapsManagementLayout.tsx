import { Outlet } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";
import Tabs from "./Tabs";

function SnapsManagementLayout(): React.JSX.Element {
  return (
    <>
      <Breadcrumbs />
      <Tabs />
      <Outlet />
    </>
  );
}

export default SnapsManagementLayout;
