import React, { Fragment } from "react";
import PropTypes from "prop-types";

import RevisionLabel from "../revisionLabel";
import ContextualMenu from "../contextualMenu";
import { RISKS, RISKS_WITH_AVAILABLE } from "../../constants";

import {
  isInDevmode,
  isRevisionBuiltOnLauchpad,
  canBeReleased,
} from "../../helpers";
import { useDragging, Handle } from "../dnd";

import { promoteRevision } from "../../actions/pendingReleases";

import ReleaseMenuItem from "./releaseMenuItem";

// content of a cell when channel is closed
export const CloseChannelInfo = () => (
  <Fragment>
    close channel
    <span className="p-tooltip__message">Pending channel close</span>
  </Fragment>
);

// content of an empty cell in 'Available' row (when nothing was assigned)
export const UnassignedInfo = ({ availableCount }) => (
  <span className="p-release-data__info">
    <span className="p-release-data__title">Add revision</span>
    <span className="p-release-data__meta">{availableCount} available</span>
  </span>
);

UnassignedInfo.propTypes = {
  availableCount: PropTypes.number,
};

// content of empty cell in channel row (nothing released or tracking channel)
export const EmptyInfo = ({ trackingChannel, failed }) => {
  const trackingChannelSplit = trackingChannel
    ? trackingChannel.split("/")
    : null;

  return (
    <Fragment>
      <span className="p-release-data__info--empty">
        {trackingChannel ? (
          <small>
            Tracking {trackingChannelSplit[0]}/{trackingChannelSplit[1]}
          </small>
        ) : failed ? "x": (
          "-"
        )}
      </span>

      <span className="p-tooltip__message u-hide--small">
        {trackingChannel
          ? `Tracking ${trackingChannel}`
          : failed? "An error occured"
          : "Nothing currently released"}
      </span>
    </Fragment>
  );
};

EmptyInfo.propTypes = {
  trackingChannel: PropTypes.string,
};

const ProgressiveTooltip = ({ revision, previousRevision }) => {
  const { progressive } = revision?.releases?.[0];

  if (!progressive) {
    return;
  }

  const previousRevisionData = (
    <>
      <strong>{previousRevision?.revision || "Unknown"}</strong>
      <br />
      <strong>
        {Math.round(100 - progressive["current-percentage"]) || 0}% →{" "}
        {Math.round(100 - progressive.percentage)}%
      </strong>
      <br />
      <strong>{previousRevision?.version || "Unknown"}</strong>
      <br />
      {previousRevision?.attributes?.["build-request-id"] && (
        <>
          {previousRevision.attributes["build-request-id"]}
          <br />
        </>
      )}
      <strong>{previousRevision?.confinement || "Unknown"}</strong>
    </>
  );

  const currentRevisionData = (
    <>
      <strong>{revision.revision} (progressive)</strong>
      <br />
      <strong>
        {Math.round(progressive["current-percentage"]) || 0}% →{" "}
        {Math.round(progressive.percentage)}%
      </strong>
      <br />
      <strong>{revision.version}</strong>
      <br />
      {revision?.attributes?.["build-request-id"] && (
        <>
          {revision.attributes["build-request-id"]}
          <br />
        </>
      )}
      <strong>{revision.confinement}</strong>
    </>
  );

  const tooltipLabels = (
    <>
      Revision:
      <br />
      Release progress:
      <br />
      Version:
      <br />
      {revision?.attributes?.["build-request-id"] && (
        <>
          Build:
          <br />
        </>
      )}
      Confinement:
    </>
  );

  return (
    <div className="row">
      <div className="col-4">{tooltipLabels}</div>
      <div className="col-4">{previousRevisionData}</div>
      <div className="col-4 u-truncate">{currentRevisionData}</div>
    </div>
  );
};

ProgressiveTooltip.propTypes = {
  revision: PropTypes.object,
  previousRevision: PropTypes.object,
};

// contents of a cell with a revision
export const RevisionInfo = ({
  revision,
  isPending,
  previousRevision,
  risk,
  channel,
}) => {
  let buildIcon = null;

  if (isRevisionBuiltOnLauchpad(revision)) {
    buildIcon = <i className="p-icon--lp" />;
  }

  const releasable = canBeReleased(revision);

  const blockedMessage = (revision) => (
    <Fragment>
      Can’t be released: <b>{revision.status}.</b>
      <br />
    </Fragment>
  );

  const currentRelease = revision.releases?.filter(
    (r) => r.channel === channel,
  );

  // This mimics what the snapcraft cli does as some fields may be
  // present even if a release is not progressive
  const isProgressive =
    currentRelease?.length > 0 &&
    currentRelease[0].isProgressive &&
    risk !== "AVAILABLE"
      ? true
      : false;

  return (
    <Fragment>
      <span className="p-release-data__info">
        <span className="p-release-data__title">
          <RevisionLabel
            revision={revision}
            showTooltip={false}
            isProgressive={isProgressive}
            previousRevision={previousRevision?.revision}
          />
          &nbsp;
          {!releasable && <i className="p-icon--warning"></i>}
        </span>
        <span className="p-release-data__meta">
          {isProgressive
            ? "Progressive release"
            : `
            ${revision.version}
            ${
              revision?.attributes?.["build-request-id"]
                ? ` | ${revision.attributes["build-request-id"]}`
                : ""
            }`}
        </span>{" "}
      </span>
      <span className="p-tooltip__message u-hide--small">
        {isProgressive ? (
          <ProgressiveTooltip
            revision={revision}
            previousRevision={previousRevision}
          />
        ) : (
          <>
            {isPending && "Pending release of:"}

            <div className="p-tooltip__group">
              {!releasable && blockedMessage(revision)}
              Revision: <b>{revision.revision}</b>
              <br />
              Version: <b>{revision.version}</b>
              {revision?.attributes?.["build-request-id"] && (
                <Fragment>
                  <br />
                  Build: {buildIcon}{" "}
                  <b>{revision.attributes["build-request-id"]}</b>
                </Fragment>
              )}
              {isInDevmode(revision) && (
                <Fragment>
                  <br />
                  {revision.confinement === "devmode" ? (
                    <Fragment>
                      Confinement: <b>devmode</b>
                    </Fragment>
                  ) : (
                    <Fragment>
                      Grade: <b>devel</b>
                    </Fragment>
                  )}
                </Fragment>
              )}
              <br />
            </div>
            {isInDevmode(revision) && (
              <div className="p-tooltip__group">
                Revisions in <b>devmode</b> or with grade <b>devel</b> can’t
                <br />
                be promoted to stable or candidate channels.
              </div>
            )}
          </>
        )}
      </span>
    </Fragment>
  );
};

RevisionInfo.propTypes = {
  revision: PropTypes.object,
  isPending: PropTypes.bool,
  previousRevision: PropTypes.object,
  risk: PropTypes.string,
  channel: PropTypes.string,
};

// generic draggable view of releases table cell
export const ReleasesTableCellView = (props) => {
  const { item, canDrag, children, actions, cellType, current, arch } = props;

  const [isDragging, isGrabbing, drag] = useDragging({
    item,
    canDrag,
  });

  const classNames = [
    "p-releases-table__cell",
    isGrabbing ? "is-grabbing" : "",
    isDragging ? "is-dragging" : "",
    canDrag ? "is-draggable" : "",
  ].join(" ");

  const className = `${classNames} ${props.className}`;

  return (
    <div
      className={className}
      onMouseEnter={() => {
        const hoveredRow = document.querySelector(
          ".p-releases-table__row.is-hovered",
        );

        if (hoveredRow) {
          hoveredRow.classList.remove("is-hovered");
        }
      }}
    >
      <div className="p-heading--5 u-no-margin--bottom u-hide--medium u-hide--large">
        {arch}
      </div>
      <div
        ref={drag}
        className="p-release-data p-tooltip p-tooltip--btm-center"
      >
        {children}
        {canDrag && (
          <>
            <ContextualMenu
              className="p-button is-small"
              label={cellType === "revision" ? "Release" : "Promote"}
            >
              <span className="p-contextual-menu__group">
                <span className="p-contextual-menu__item">
                  {cellType === "revision" ? "Release" : "Promote"} to:
                </span>
                {RISKS.map((risk) => {
                  return (
                    <ReleaseMenuItem
                      key={risk}
                      currentTrack={risk}
                      risk={risk}
                      pendingChannelMap={RISKS_WITH_AVAILABLE}
                      item={item}
                      promoteRevision={promoteRevision}
                      current={current}
                    />
                  );
                })}
              </span>
            </ContextualMenu>
            <Handle />
          </>
        )}
      </div>
      {actions}
    </div>
  );
};

ReleasesTableCellView.propTypes = {
  item: PropTypes.object,
  canDrag: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  actions: PropTypes.node,
  cellType: PropTypes.string,
  current: PropTypes.string,
  arch: PropTypes.string,
};
