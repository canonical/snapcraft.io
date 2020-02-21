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
      builds: props.builds ? props.builds : []
    };

    this.showMoreHandler = this.showMoreHandler.bind(this);
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
        const newBuilds = builds;

        this.setState({
          isLoading: false,
          builds: fromStart
            ? result.snap_builds
            : newBuilds.concat(result.snap_builds)
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

  componentDidMount() {
    const { builds, updateFreq } = this.props;
    if (!builds) {
      this.fetchBuilds();
    }

    if (updateFreq) {
      this.fetchTimer = setTimeout(() => this.fetchBuilds(true), updateFreq);
    }
  }

  render() {
    const { builds, isLoading } = this.state;
    const { totalBuilds, singleBuild, snapName } = this.props;

    const remainingBuilds = totalBuilds - builds.length;

    const showMoreCount = remainingBuilds > 15 ? 15 : remainingBuilds;

    const rows = builds.map(build => {
      const status = UserFacingStatus[build.status];
      let icon;

      if (status.icon) {
        icon = `p-icon--${status.icon}`;
      }

      return {
        columns: [
          {
            content: singleBuild ? (
              `#${build.id}`
            ) : (
              <a href={`/${snapName}/builds/${build.id}`}>#{build.id}</a>
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

    return (
      <Fragment>
        <MainTable
          headers={[
            {
              content: "ID"
            },
            {
              content: "Architecture"
            },
            {
              content: "Duration",
              className: "u-hide--small"
            },
            {
              content: "Result",
              className: "has-icon"
            },
            {
              content: ""
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
  singleBuild: PropTypes.boolean
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
