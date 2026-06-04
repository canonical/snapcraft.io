import { Outlet, useParams } from "react-router-dom";
import { Notification } from "@canonical/react-components";
import useSnapReleaseStatus from "../../hooks/useSnapReleaseStatus";
import Breadcrumbs from "./Breadcrumbs";
import Tabs from "./Tabs";

function SnapsManagementLayout(): React.JSX.Element {
  const { snapId } = useParams<{ snapId: string }>();
  const { data, isLoading } = useSnapReleaseStatus(snapId);
  const noReleases = !isLoading && data?.has_releases === false;

  return (
    <>
      <Breadcrumbs />
      <Tabs disabled={noReleases} />
      {noReleases ? (
        <div style={{ marginTop: "1.5rem" }}>
          <Notification severity="caution" title="No published revision yet">
            Your snap name is registered, but it doesn’t have a first build yet.{" "}
            Follow the{" "}
            <a
              href="https://documentation.ubuntu.com/snapcraft/stable/how-to/publishing/publish-a-snap/"
              target="_blank"
              rel="noreferrer"
            >
              releasing your app
            </a>{" "}
            guide to publish your first revision and access the snap management
            interface.
          </Notification>
        </div>
      ) : (
        <Outlet context={{ noReleases }} />
      )}
    </>
  );
}

export default SnapsManagementLayout;
