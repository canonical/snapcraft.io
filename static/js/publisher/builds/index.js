import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

import BuildsTable from "./components/buildsTable";

import { TriggerBuildStatus, BuildRequestStatus } from "./helpers";

import TriggerBuild from "./components/triggerBuild";

class Builds extends React.Component {
  constructor(props) {
    super(props);

    this.fetchTimer = null;

    this.state = {
      triggerBuildLoading: false,
      triggerBuildStatus: TriggerBuildStatus.IDLE,
      triggerBuildErrorMessage: "",
      isLoading: false,
      fetchSize: 15,
      fetchStart: 0,
      builds: props.builds,
      queueTime:
        props.builds.length > 0 ? this.getInitialQueueTime(props.builds) : {},
      shouldUpdateQueueTime: true,
    };

    this.showMoreHandler = this.showMoreHandler.bind(this);
    this.triggerBuildHandler = this.triggerBuildHandler.bind(this);

    const { builds, updateFreq } = props;
    if (!builds) {
      this.fetchBuilds();
    } else {
      if (updateFreq) {
        this.fetchTimer = setTimeout(() => this.fetchBuilds(true), updateFreq);
      }
    }
  }

  getInitialQueueTime(builds) {
    let newQueueTime = {};

    builds.forEach((build) => {
      if (build.status === "building_soon" && build.queue_time) {
        newQueueTime[build.arch_tag] = build.queue_time;
      }
    });

    return newQueueTime;
  }

  updateQueueTime() {
    const { queueTime, builds } = this.state;
    let newQueueTime = {};

    builds.forEach((build) => {
      const isBuildingSoon =
        build.status === "building_soon" && build.queue_time;
      if (isBuildingSoon) {
        newQueueTime[build.arch_tag] = queueTime[build.arch_tag]
          ? queueTime[build.arch_tag]
          : build.queue_time;
      }
    });

    this.setState({
      queueTime: newQueueTime,
      shouldUpdateQueueTime: newQueueTime ? true : false,
    });
  }

  fetchBuilds(fromStart) {
    const {
      fetchSize,
      fetchStart,
      builds,
      triggerBuildStatus,
      triggerBuildLoading,
      shouldUpdateQueueTime,
    } = this.state;
    const { snapName } = this.props;
    const { SUCCESS, IDLE } = TriggerBuildStatus;

    let url = `/${snapName}/builds.json`;
    let params = [];

    if (fetchStart && !fromStart) {
      params.push(`start=${fetchStart}`);
    }

    if (fetchSize) {
      params.push(`size=${fetchSize}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        this.setState(
          {
            triggerBuildLoading:
              triggerBuildStatus === SUCCESS ? !SUCCESS : triggerBuildLoading,
            triggerBuildStatus:
              triggerBuildStatus === SUCCESS ? IDLE : triggerBuildStatus,
            isLoading: false,
            builds: fromStart
              ? result.snap_builds
              : builds.slice().concat(result.snap_builds),
          },
          () => {
            if (shouldUpdateQueueTime) {
              this.updateQueueTime();
            }
            this.triggerFetchBuilds();
          }
        );
      })
      .catch(() => {
        this.setState({
          isLoading: false,
        });
        this.triggerFetchBuilds();
      });
  }

  triggerFetchBuilds() {
    const { updateFreq } = this.props;

    if (this.fetchTimer) {
      clearTimeout(this.fetchTimer);
    }
    if (updateFreq) {
      this.fetchTimer = setTimeout(() => this.fetchBuilds(true), updateFreq);
    }
  }

  triggerFetchBuildRequest(build_id) {
    const { ERROR, SUCCESS } = TriggerBuildStatus;
    const { PENDING, COMPLETED, FAILED } = BuildRequestStatus;
    const url = `/${snapName}/builds/check-build-request/`;

    fetch(`${url}/${build_id}`, {
      method: "GET",
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          if (result.status === PENDING) {
            setTimeout(
              () => this.triggerFetchBuildRequest(build_id),
              this.props.updateFreq
            );
          } else if (result.status === COMPLETED) {
            this.setState({ triggerBuildStatus: SUCCESS });
          } else if (result.status === FAILED) {
            this.setState({
              triggerBuildStatus: ERROR,
              triggerBuildErrorMessage: result.error.message
                ? result.error.message
                : "Build request failed",
            });
          }
        } else {
          this.setState({
            triggerBuildStatus: ERROR,
            triggerBuildErrorMessage: result.error.message
              ? result.error.message
              : "",
          });
        }
      })
      .catch((error) => {
        this.setState({
          triggerBuildStatus: ERROR,
          triggerBuildErrorMessage: error.message ? error.message : "",
        });
      });
  }

  triggerBuildHandler() {
    const { csrf_token, snapName } = this.props;
    const { ERROR, SUCCESS } = TriggerBuildStatus;
    const url = `/${snapName}/builds/trigger-build`;

    this.setState({ triggerBuildLoading: true });

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrf_token,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          this.setState({ triggerBuildStatus: SUCCESS });
        } else {
          this.setState({
            triggerBuildStatus: ERROR,
            triggerBuildErrorMessage: result.error.message
              ? result.error.message
              : "",
          });
        }
      })
      .catch((error) => {
        this.setState({
          triggerBuildStatus: ERROR,
          triggerBuildErrorMessage: error.message ? error.message : "",
        });
      });
  }

  showMoreHandler(e) {
    const { fetchStart, fetchSize } = this.state;
    e.preventDefault();
    this.setState(
      {
        fetchStart: fetchStart + 15,
        fetchSize: fetchSize + 15,
        isLoading: true,
      },
      () => {
        this.fetchBuilds();
      }
    );
  }

  render() {
    const {
      builds,
      isLoading,
      triggerBuildStatus,
      triggerBuildErrorMessage,
      triggerBuildLoading,
      queueTime,
    } = this.state;
    const { totalBuilds, singleBuild, snapName } = this.props;
    const { ERROR } = TriggerBuildStatus;

    return (
      <Fragment>
        {!singleBuild && (
          <TriggerBuild
            hasError={triggerBuildStatus === ERROR ? true : false}
            errorMessage={triggerBuildErrorMessage}
            isLoading={triggerBuildLoading}
            onClick={this.triggerBuildHandler}
          />
        )}
        <BuildsTable
          builds={builds}
          singleBuild={singleBuild}
          snapName={snapName}
          queueTime={queueTime}
          totalBuilds={totalBuilds}
          isLoading={isLoading}
          showMoreHandler={this.showMoreHandler}
        />
      </Fragment>
    );
  }
}

Builds.propTypes = {
  csrf_token: PropTypes.string,
  snapName: PropTypes.string,
  builds: PropTypes.array,
  totalBuilds: PropTypes.number,
  updateFreq: PropTypes.number,
  singleBuild: PropTypes.bool,
};

Builds.defaultProps = {
  singleBuild: false,
};

export function initBuilds(
  id,
  snapName,
  csrf_token,
  builds,
  totalBuilds,
  singleBuild
) {
  ReactDOM.render(
    <Builds
      snapName={snapName}
      csrf_token={csrf_token}
      builds={builds}
      totalBuilds={totalBuilds}
      updateFreq={singleBuild ? null : 30000}
      singleBuild={singleBuild}
    />,
    document.querySelector(id)
  );
}
