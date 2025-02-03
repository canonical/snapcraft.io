import { ReactNode } from "react";
import { Outlet } from "react-router-dom";

function Root(): ReactNode {
  return <Outlet />;
}

export default Root;
