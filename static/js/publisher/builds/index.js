import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

import distanceInWords from "date-fns/distance_in_words_strict";

import MainTable from "@canonical/react-components/dist/components/MainTable";

import { UserFacingStatus, createDuration } from "./helpers";

class Builds extends React.Component {
  constructor(props) {
    super(props);

    this.fetchTimer = null;

    this.state = {
      isLoading: false,
      fetchSize: 15,
      fetchStart: 0,
      isTooSlow: false,
      builds: props.builds ? props.builds : []
    };

    this.initTimer = setTimeout(() => {
      this.setState({
        isTooSlow: true
      });
    }, 35000);

    this.showMoreHandler = this.showMoreHandler.bind(this);

    const { builds, updateFreq } = props;
    if (!builds) {
      this.fetchBuilds();
    } else {
      if (updateFreq) {
        this.fetchTimer = setTimeout(() => this.fetchBuilds(true), updateFreq);
      }
    }
  }

  fetchBuilds(fromStart) {
    const { fetchSize, fetchStart, builds } = this.state;
    const { snapName, updateFreq } = this.props;

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
        this.setState({
          isLoading: false,
          isTooSlow: builds.length === 0 && result.snap_builds.length === 0,
          builds: fromStart
            ? result.snap_builds
            : builds.slice().concat(result.snap_builds)
        });
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
    const { builds, isLoading, isTooSlow } = this.state;
    const { totalBuilds, singleBuild, snapName } = this.props;

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
              className: "has-icon"
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
        {isTooSlow && (
          <div className="u-fixed-width">
            <div className="p-notification--caution">
              <div className="p-notification__response">
                Builds seem to be taking a while, try refreshing the page. If
                the issue persists, try triggering a new build.
              </div>
            </div>
          </div>
        )}
        <MainTable
          headers={[
            {
              content: "ID"
            },
            {
              content: "Architecture"
            },
            {
              content: "Build Duration",
              className: "u-hide--small"
            },
            {
              content: "Result",
              className: "has-icon"
            },
            {
              content: "Build Finished",
              className: "u-align-text--right"
            }
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
  snapName: PropTypes.string,
  builds: PropTypes.array,
  totalBuilds: PropTypes.number,
  updateFreq: PropTypes.number,
  singleBuild: PropTypes.bool
};

Builds.defaultProps = {
  singleBuild: false
};

export function initBuilds(id, snapName, builds, totalBuilds, singleBuild) {
  ReactDOM.render(
    <Builds
      snapName={snapName}
      builds={builds}
      totalBuilds={totalBuilds}
      updateFreq={singleBuild ? null : 30000}
      singleBuild={singleBuild}
    />,
    document.querySelector(id)
  );
}
