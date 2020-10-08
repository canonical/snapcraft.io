import React, { Fragment } from "react";
import PropTypes from "prop-types";
import { formatDistance, parseISO } from "date-fns";

import ModularTable from "@canonical/react-components/dist/components/ModularTable";
import SummaryButton from "@canonical/react-components/dist/components/SummaryButton";

import { UserFacingStatus, createDuration } from "../helpers";

const StatusCell = ({ build, queueTime }) => {
  const status = UserFacingStatus[build.status];

  const title =
    build.queue_time && queueTime[build.arch_tag]
      ? `Queue time: up to ${queueTime[build.arch_tag]}`
      : null;

  return (
    <Fragment>
      <span className="u-hide u-show--small">{status.shortStatusMessage}</span>
      <span className="u-hide--small" title={title}>
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

const BuildsTable = ({
  builds,
  singleBuild,
  snapName,
  queueTime,
  totalBuilds,
  isLoading,
  showMoreHandler,
}) => {
  const columns = React.useMemo(
    () => [
      {
        Header: "ID",
        accessor: "id",
        Cell: ({ value }) =>
          value ? (
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
        className: "p-table__cell--icon-placeholder u-truncate",
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
        getCellIcon: ({ row }) => {
          const status = UserFacingStatus[row.original.status];
          return status.icon ? status.icon : false;
        },
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
    // updates to builds and queueTime affect columns, so they should be recalculated when they change
    [builds, queueTime]
  );

  const data = React.useMemo(() => builds, [builds]);

  const remainingBuilds = totalBuilds - builds.length;
  const showMoreCount = remainingBuilds > 15 ? 15 : remainingBuilds;

  const footer =
    remainingBuilds > 0 ? (
      <div className="u-align--right">
        <SummaryButton
          summary={`Showing ${builds.length} out of ${totalBuilds} builds.`}
          label={`Show ${showMoreCount} more`}
          isLoading={isLoading}
          onClick={showMoreHandler}
        />
      </div>
    ) : null;

  return (
    <React.Fragment>
      <ModularTable
        columns={columns}
        data={data}
        emptyMsg="Waiting for builds..."
        footer={footer}
      />
    </React.Fragment>
  );
};

BuildsTable.propTypes = {
  builds: PropTypes.array,
  snapName: PropTypes.string,
  singleBuild: PropTypes.bool,
  queueTime: PropTypes.object,
  totalBuilds: PropTypes.number,
  isLoading: PropTypes.bool,
  showMoreHandler: PropTypes.func,
};

export default BuildsTable;
