import { Outlet, useLocation } from "react-router-dom";
import ModelBreadcrumb from "./ModelBreadcrumb";
import ModelNav from "./ModelNav";

function ModelDetailsPageLayout() {
  const { pathname } = useLocation();
  const isPolicies =
    pathname.endsWith("policies") || pathname.endsWith("policies/create");
  const isRemodel =
    pathname.endsWith("remodel") || pathname.endsWith("remodel/configure");

  const getSectionName = () => {
    if (isPolicies) {
      return "policies";
    }

    if (isRemodel) {
      return "remodel";
    }

    return "overview";
  };

  return (
    <>
      <ModelBreadcrumb />
      <ModelNav sectionName={getSectionName()} />
      <Outlet />
    </>
  );
}

export default ModelDetailsPageLayout;
