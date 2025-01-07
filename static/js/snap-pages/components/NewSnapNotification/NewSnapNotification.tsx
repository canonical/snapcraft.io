import { Link, Notification } from "@canonical/react-components";
import { ISnap } from "../../types";

export const NewSnapNotification = ({ snap }: { snap: ISnap }) => {
  const latestRelease = snap.latest_release;
  const snapName = snap.snapName;

  const title = latestRelease
    ? `You've released ${snapName} to the "${latestRelease.channels[0]}" channel!`
    : `You've uploaded ${snapName}!`;

  return (
    <>
      <Notification severity="information" title={title}>
        <p>
          Want to improve the listing in stores?
          <Link
            href={`/${snapName}/listing`}
            className="p-snap-list__notification-link"
          >
            Edit store listing
          </Link>
          {!latestRelease && (
            <>
              <br />
              Is your snap ready to release?
              <Link
                href="/docs/releasing-your-app"
                target="_blank"
                className="p-snap-list__notification-link"
              >
                Release it
              </Link>
            </>
          )}
        </p>
      </Notification>
    </>
  );
};
