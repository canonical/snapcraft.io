import { Outlet, useLocation } from "react-router-dom";
import ModelBreadcrumb from "./ModelBreadcrumb";
import ModelNav from "./ModelNav";

function ModelDetailsPageLayout() {
  const { pathname } = useLocation();
  const isPolicies = pathname.endsWith("policies");

  return (
    <>
      <ModelBreadcrumb />
      <ModelNav sectionName={isPolicies ? "policies" : "overview"} />
      <Outlet />
    </>
  );
}

export default ModelDetailsPageLayout;
