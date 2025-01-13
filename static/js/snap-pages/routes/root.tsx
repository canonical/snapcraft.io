import { Outlet } from "react-router-dom";
import { Panel } from "@canonical/react-components";

function Root(): JSX.Element {
  return (
    <>
      <div id="main-content">
        <Panel>
          <Outlet />
        </Panel>
      </div>
    </>
  );
}

export default Root;
