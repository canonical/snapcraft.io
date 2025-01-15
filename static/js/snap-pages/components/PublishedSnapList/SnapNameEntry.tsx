import { Link, Tooltip } from "@canonical/react-components";
import { ISnap } from "../../types";

function SnapNameEntry({ snap }: { snap: ISnap }) {
  const { snapName, status, icon_url } = snap;
  return (
    <Link href={`/${snapName}/listing`} className="p-heading-icon--small">
      <span className="p-heading-icon__header">
        <img
          src={
            icon_url
              ? icon_url
              : "https://assets.ubuntu.com/v1/be6eb412-snapcraft-missing-icon.svg"
          }
          width="32"
          height="32"
          className="p-heading-icon__img"
          alt="snap icon"
        />

        <p className="u-no-margin--bottom">
          {snapName}
          {status === "DisputePending" && (
            <>
              &nbsp;
              <Tooltip message="Name dispute in progress">
                <i className="p-icon--warning"></i>
              </Tooltip>
            </>
          )}
        </p>
      </span>
    </Link>
  );
}

export default SnapNameEntry;