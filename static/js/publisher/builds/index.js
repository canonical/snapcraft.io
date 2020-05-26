import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

import distanceInWords from "date-fns/distance_in_words_strict";

import MainTable from "@canonical/react-components/dist/components/MainTable";

import {
  UserFacingStatus,
  createDuration,
  TriggerBuildStatus
} from "./helpers";

import TriggerBuild from "./components/triggerBuild";

class Builds extends React.Component {
  constructor(props) {
    super(props);

    this.fetchTimer = null;

    this.state = {
      triggerBuildLoading: false,
      triggerBuildStatus: TriggerBuildStatus.IDLE,
      isLoading: false,
      fetchSize: 15,
      fetchStart: 0,
      builds: props.builds,
      queueTime:
        props.builds.length > 0 ? this.getInitialQueueTime(props.builds) : {},
      shouldUpdateQueueTime: true
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

    builds.forEach(build => {
      if (build.status === "building_soon" && build.queue_time) {
        newQueueTime[build.arch_tag] = build.queue_time;
      }
    });

    return newQueueTime;
  }

  updateQueueTime() {
    const { queueTime, builds } = this.state;
    let newQueueTime = {};

    builds.forEach(build => {
      const isBuildingSoon =
        build.status === "building_soon" && build.queue_time;
      if (isBuildingSoon) {
        newQueueTime = queueTime[build.arch_tag]
          ? queueTime[build.arch_tag]
          : build.queue_time;
      }
    });

    this.setState({
      queueTime: newQueueTime,
      shouldUpdateQueueTime: newQueueTime ? true : false
    });
  }

  fetchBuilds(fromStart) {
    const {
      fetchSize,
      fetchStart,
      builds,
      triggerBuildStatus,
      triggerBuildLoading,
      shouldUpdateQueueTime
    } = this.state;
    const { snapName, updateFreq } = this.props;
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
      .then(res => res.json())
      .then(result => {
        this.setState(
          {
            triggerBuildLoading:
              triggerBuildStatus === SUCCESS ? !SUCCESS : triggerBuildLoading,
            triggerBuildStatus:
              triggerBuildStatus === SUCCESS ? IDLE : triggerBuildStatus,
            isLoading: false,
            builds: fromStart
              ? result.snap_builds
              : builds.slice().concat(result.snap_builds)
          },
          () => {
            if (shouldUpdateQueueTime) {
              this.updateQueueTime();
            }
          }
        );
      })
      .catch(() => {
        this.setState({
          isLoading: false
        });
      });

    if (this.fetchTimer) {
      clearTimeout(this.fetchTimer);
    }
    if (updateFreq) {
      this.fetchTimer = setTimeout(() => this.fetchBuilds(true), updateFreq);
    }
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
        "X-CSRFToken": csrf_token
      }
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          this.setState({ triggerBuildStatus: SUCCESS });
        } else {
          this.setState({ triggerBuildStatus: ERROR });
        }
      })
      .catch(() => {
        this.setState({ triggerBuildStatus: ERROR });
      });
  }

  showMoreHandler(e) {
    const { fetchStart, fetchSize } = this.state;
    e.preventDefault();
    this.setState(
      {
        fetchStart: fetchStart + 15,
        fetchSize: fetchSize + 15,
        isLoading: true
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
      triggerBuildLoading,
      queueTime
    } = this.state;
    const { totalBuilds, singleBuild, snapName } = this.props;

    const { ERROR } = TriggerBuildStatus;

    const remainingBuilds = totalBuilds - builds.length;

    const showMoreCount = remainingBuilds > 15 ? 15 : remainingBuilds;

    let rows;

    if (builds.length > 0) {
      rows = builds.map(build => {
        let buildStatus = build.status;
        if (build.status === "in_progress" && build.duration) {
          buildStatus = "releasing_soon";
        }
        const status = UserFacingStatus[buildStatus];
        let icon;

        if (status.icon) {
          icon = `p-icon--${status.icon}`;
        }

        return {
          columns: [
            {
              content: build.id ? (
                singleBuild ? (
                  `#${build.id}`
                ) : (
                  <a href={`/${snapName}/builds/${build.id}`}>#{build.id}</a>
                )
              ) : (
                ""
              )
            },
            {
              content: build.arch_tag
            },
            {
              content: createDuration(build.duration),
              className: "u-hide--small"
            },
            {
              content: (
                <Fragment>
                  <span className="u-hide u-show--small">
                    {icon && <i className={icon} />}
                    {status.shortStatusMessage}
                  </span>
                  <span className="u-hide--small">
                    {icon && <i className={icon} />}
                    {status.statusMessage}
                  </span>
                </Fragment>
              ),
              className: "has-icon",
              title: queueTime[build.arch_tag]
                ? `Queue time: up to ${queueTime[build.arch_tag]}`
                : null
            },
            {
              content: build.datebuilt
                ? distanceInWords(new Date(), build.datebuilt, {
                    addSuffix: true
                  })
                : "",
              className: "u-align-text--right"
            }
          ]
        };
      });
    } else {
      rows = [
        {
          columns: [
            {
              content: "Waiting for builds..."
            }
          ]
        }
      ];
    }

    return (
      <Fragment>
        <TriggerBuild
          hasError={triggerBuildStatus === ERROR ? true : false}
          isLoading={triggerBuildLoading}
          onClick={this.triggerBuildHandler}
        />
        <MainTable
          headers={[
            { content: "ID" },
            { content: "Architecture" },
            { content: "Build Duration", className: "u-hide--small" },
            { content: "Result", className: "has-icon" },
            { content: "Build Finished", className: "u-align-text--right" }
          ]}
          rows={rows}
        />
        {builds.length < totalBuilds && (
          <div className="p-show-more__link-container">
            {isLoading && (
              <span className="p-show-more__link">
                <i className="p-icon--spinner u-animation--spin" />
              </span>
            )}
            {!isLoading && (
              <a className="p-show-more__link" onClick={this.showMoreHandler}>
                Show {showMoreCount} more
              </a>
            )}
          </div>
        )}
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
  singleBuild: PropTypes.bool
};

Builds.defaultProps = {
  singleBuild: false
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
