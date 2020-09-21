import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { formatDistance, parseISO } from "date-fns";

import ModularTable from "@canonical/react-components/dist/components/ModularTable";

import { UserFacingStatus, createDuration } from "../helpers";

const StatusCell = ({ build, queueTime }) => {
  const status = UserFacingStatus[build.status];

  let icon;

  if (status.icon) {
    icon = `p-icon--${status.icon}`;
  }

  const title =
    build.queue_time && queueTime[build.arch_tag]
      ? `Queue time: up to ${queueTime[build.arch_tag]}`
      : null;

  return (
    <Fragment>
      <span className="u-hide u-show--small">
        {icon && <i className={icon} />}
        {status.shortStatusMessage}
      </span>
      <span className="u-hide--small" title={title}>
        {icon && <i className={icon} />}
        {status.statusMessage}
      </span>
    </Fragment>
  );
};

StatusCell.propTypes = {
  build: PropTypes.shape({
    status: PropTypes.string.isRequired,
    queue_time: PropTypes.string,
    arch_tag: PropTypes.string.isRequired,
  }),
  queueTime: PropTypes.object,
};

const BuildsTable = ({ builds, singleBuild, snapName, queueTime }) => {
  const isWaiting = !builds || builds.length === 0;

  if (isWaiting) {
    // create a dummy row to show "Waiting..." message
    builds = [{ status: "unknown" }];
  }

  const columns = React.useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
        Cell: ({ value }) =>
          isWaiting ? (
            "Waiting for builds..."
          ) : value ? (
            singleBuild ? (
              `#${value}`
            ) : (
              <a href={`/${snapName}/builds/${value}`}>#{value}</a>
            )
          ) : (
            ""
          ),
      },
      { Header: "Architecture", accessor: "arch_tag" },
      {
        Header: "Build Duration",
        accessor: "duration",
        className: "u-hide--small",
        Cell: ({ value }) => createDuration(value),
      },
      {
        Header: "Result",
        className: "p-table__cell--icon-placeholder",
        accessor: (build) =>
          build.status === "in_progress" && build.duration
            ? "releasing_soon"
            : build.status,
        // this function is technically an inline React component,
        // but we don't want to define a name and props for it
        // eslint-disable-next-line react/display-name, react/prop-types
        Cell: ({ row }) => (
          // get the raw build object from the row data
          // eslint-disable-next-line react/prop-types
          <StatusCell queueTime={queueTime} build={row.original} />
        ),
      },
      {
        Header: "Build Finished",
        accessor: "datebuilt",
        className: "u-align-text--right",
        Cell: ({ value }) =>
          value
            ? formatDistance(parseISO(value), new Date(), {
                addSuffix: true,
              })
            : "",
      },
    ],
    []
  );

  const data = React.useMemo(() => builds, [builds]);

  return <ModularTable columns={columns} data={data} />;
};

BuildsTable.propTypes = {
  builds: PropTypes.array,
  snapName: PropTypes.string,
  singleBuild: PropTypes.bool,
  queueTime: PropTypes.object,
};

export default BuildsTable;
