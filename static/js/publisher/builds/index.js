import React, { Fragment } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";

import distanceInWords from "date-fns/distance_in_words_strict";

import MainTable from "@canonical/react-components/dist/components/MainTable";

const NEVER_BUILT = "never_built";
const BUILDING_SOON = "building_soon";
const WONT_RELEASE = "wont_release";
const RELEASED = "released";
const RELEASE_FAILED = "release_failed";
const RELEASING_SOON = "releasing_soon";
const IN_PROGRESS = "in_progress";
const FAILED_TO_BUILD = "failed_to_build";
const UNKNOWN = "unknown";

export const UserFacingStatus = {
  // Used only when there is no build returned from LP.
  // When build is returned from LP (scheduled) it's 'Building soon' for BSI.
  [NEVER_BUILT]: createStatus("Never built", "Never built", 8, "never_built"),
  [BUILDING_SOON]: createStatus(
    "Building soon",
    "Building",
    7,
    "building_soon"
  ),
  [WONT_RELEASE]: createStatus(
    "Built, won’t be released",
    "Built",
    6,
    "wont_release"
  ),
  [RELEASED]: createStatus("Built and released", "Released", 5, "released"),
  [RELEASE_FAILED]: createStatus(
    "Built, failed to release",
    "Failed",
    4,
    "release_failed"
  ),
  [RELEASING_SOON]: createStatus(
    "Built, releasing soon",
    "Built",
    3,
    "releasing_soon"
  ),
  [IN_PROGRESS]: createStatus("In progress", "In progress", 2, "in_progress"),
  [FAILED_TO_BUILD]: createStatus(
    "Failed to build",
    "Failed",
    1,
    "failed_to_build"
  ),
  [UNKNOWN]: createStatus("Unknown", "Unknown", 8, "never_built")
};

function createStatus(statusMessage, shortStatusMessage, priority, badge) {
  return {
    statusMessage,
    shortStatusMessage,
    icon: badge.indexOf("failed") > -1 ? "error" : false,
    priority,
    badge
  };
}

function createDuration(duration) {
  const durationParts = duration.split(":");
  const hours = parseInt(durationParts[0]);
  const minutes = parseInt(durationParts[1]);
  const seconds = Math.round(parseInt(durationParts[2]));

  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }

  return `${seconds} second${seconds > 1 || seconds === 0 ? "s" : ""}`;
}

class Builds extends React.Component {
  constructor(props) {
    super(props);

    this.fetchTimer = null;

    this.state = {
      isLoading: false,
      fetchLimit: 15,
      builds: props.builds ? props.builds : []
    };

    this.showMoreHandler = this.showMoreHandler.bind(this);
  }

  fetchBuilds() {
    const { fetchLimit } = this.state;
    const { updateFreq } = this.props;

    fetch(`url${fetchLimit}`)
      .then(res => res.json())
      .then(result => {
        this.setState({
          isLoading: false,
          builds: result
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
    this.fetchTimer = setTimeout(() => this.fetchBuilds(), updateFreq);
  }

  showMoreHandler(e) {
    const { fetchLimit } = this.state;
    e.preventDefault();
    this.setState(
      {
        fetchLimit: fetchLimit + 15,
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

    this.fetchTimer = setTimeout(() => this.fetchBuilds(), updateFreq);
  }

  render() {
    const { builds, isLoading } = this.state;
    const rows = builds.map(build => {
      const status = UserFacingStatus[build.status];
      let icon;

      if (status.icon) {
        icon = `p-icon--${status.icon}`;
      }

      return {
        columns: [
          {
            content: <a href={build.link}>#{build.id}</a>
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
            content: distanceInWords(new Date(), build.datebuilt, {
              addSuffix: true
            }),
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
        {isLoading && <div>Loading</div>}
        {!isLoading && (
          <div className="p-show-more__link-container">
            <a className="p-show-more__link" onClick={this.showMoreHandler}>
              Show more
            </a>
          </div>
        )}
      </Fragment>
    );
  }
}

Builds.propTypes = {
  builds: PropTypes.array,
  updateFreq: PropTypes.number
};

export function initBuilds(id, snapName, builds) {
  ReactDOM.render(
    <Builds builds={builds} updateFreq={30000} />,
    document.querySelector(id)
  );
}
