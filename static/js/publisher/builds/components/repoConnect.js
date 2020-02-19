import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import Button from "@canonical/react-components/dist/components/Button";
import DatalistSelect from "./datalistSelect";
import Select from "./select";

const LOADING = "LOADING";
const ERROR = "ERROR";
const SNAP_NAME_DOES_NOT_MATCH = "SNAP_NAME_DOES_NOT_MATCH";
const MISSING_YAML_FILE = "MISSING_YAML_FILE";
const SUCCESS = "SUCCESS";

class RepoConnect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedRepo: "",
      repoList: [],
      selectedOrganization: "",
      organizations: this.props.organizations,
      user: this.props.user,
      isRepoListDisabled: true,
      message: null,
      status: null,
      snapName: this.props.snapName,
      yamlFilePath: null,
      errorType: null
    };

    this.handleRepoSelect = this.handleRepoSelect.bind(this);
    this.handleOrganiationSelect = this.handleOrganiationSelect.bind(this);
    this.fetchRepoList = this.fetchRepoList.bind(this);
    this.handleRefreshButtonClick = this.handleRefreshButtonClick.bind(this);
  }

  sortByValue(a, b) {
    return a.value.localeCompare(b.value);
  }

  /**
   * Handle repository select event
   *
   * @param repository
   */
  handleRepoSelect(selectedRepo) {
    this.setState(
      {
        selectedRepo: selectedRepo,
        status: null
      },
      () => this.checkRepo(selectedRepo)
    );
  }

  /**
   * Handle organization select event
   *
   * @param organization
   */
  handleOrganiationSelect(selectedOrganization) {
    this.setState({ selectedOrganization: selectedOrganization }, () =>
      this.fetchRepoList()
    );
  }

  /**
   * Fetch repo list of the selected organization
   *
   */
  fetchRepoList() {
    const { selectedOrganization, user } = this.state;
    let url = "";

    if (selectedOrganization === user.login) {
      url = "/publisher/github/get-repos";
    } else {
      url = `/publisher/github/get-repos?org=${selectedOrganization}`;
    }
    this.setState({
      isRepoListDisabled: true,
      status: LOADING
    });

    fetch(url)
      .then(res => res.json())
      .then(result => {
        let newRepoList = result
          .map(el => {
            return { value: el.name };
          })
          .sort(this.sortByValue);
        this.setState({
          repoList: newRepoList,
          isRepoListDisabled: false,
          status: null
        });
      })
      .catch(() => {
        this.setState({
          isRepoListDisabled: false,
          status: ERROR
        });
      });
  }

  /**
   * Check if repository is suitable for build
   *
   * @param selectedRepo
   */
  checkRepo(selectedRepo) {
    const { snapName, repoList, selectedOrganization } = this.state;
    if (selectedRepo && repoList.some(el => el.value === selectedRepo)) {
      const url = `/${snapName}/builds/validate-repo?repo=${selectedOrganization}/${selectedRepo}`;

      this.setState({
        isRepoListDisabled: true,
        status: LOADING
      });

      fetch(url)
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            this.setState({
              isRepoListDisabled: false,
              status: SUCCESS
            });
          } else {
            this.setState({
              isRepoListDisabled: false,
              status: result.error.type,
              message: result.error.message,
              yamlFilePath: result.error.yaml_location
                ? result.error.yaml_location
                : null
            });
          }
        })
        .catch(() => {
          this.setState({
            isRepoListDisabled: false,
            status: ERROR
          });
        });
    }
  }

  // Handle Refresh button click
  handleRefreshButtonClick(e) {
    e.preventDefault();
    this.checkRepo(this.state.selectedRepo);
  }

  renderMessage() {
    const {
      message,
      status,
      selectedRepo,
      selectedOrganization,
      yamlFilePath,
      snapName
    } = this.state;
    if (status === SNAP_NAME_DOES_NOT_MATCH) {
      const splitDescription = message.split(". ");
      return (
        <div className="u-fixed-width">
          <p>
            {`${splitDescription[0]}. `}
            <a
              className="p-link--external"
              href={`https://github.com/${selectedOrganization}/${selectedRepo}/edit/master/${yamlFilePath}`}
            >
              {splitDescription[1]}
            </a>
          </p>
        </div>
      );
    } else if (status === MISSING_YAML_FILE) {
      return (
        <div className="u-fixed-width">
          <p>{message}</p>
          <p>
            <a href="https://snapcraft.io/docs/creating-a-snap">
              Learn the basics
            </a>
            , or{" "}
            <a className="p-link--external" href={this.getTemplateUrl()}>
              get started with a template.
            </a>
          </p>
          <p>
            Don’t have snapcraft?{" "}
            <a href="https://snapcraft.io/docs/snapcraft-overview">
              Install it on your own PC for testing.
            </a>
          </p>
        </div>
      );
    } else if (status === ERROR) {
      return (
        <div className="u-fixed-width">
          <p>
            We were not able to check if your repository can be linked to{" "}
            {snapName}. Please check your internet connection and{" "}
            <a onClick={this.handleRefreshButtonClick}>try again</a>.
          </p>
        </div>
      );
    }
  }

  getTemplateUrl() {
    const { selectedOrganization, selectedRepo, snapName } = this.state;
    return `https://github.com/${selectedOrganization}/${selectedRepo}/new/master?filename=snap%2Fsnapcraft.yaml&value=%0A%20%20%23%20After%20registering%20a%20name%20on%20build.snapcraft.io%2C%20commit%20an%20uncommented%20line%3A%0A%20%20%23%20name%3A%20${snapName}%0A%20%20version%3A%20%270.1%27%20%23%20just%20for%20humans%2C%20typically%20%271.2%2Bgit%27%20or%20%271.3.2%27%0A%20%20summary%3A%20Single-line%20elevator%20pitch%20for%20your%20amazing%20snap%20%23%2079%20char%20long%20summary%0A%20%20description%3A%20%7C%0A%20%20%20%20This%20is%20my-snap%27s%20description.%20You%20have%20a%20paragraph%20or%20two%20to%20tell%20the%0A%20%20%20%20most%20important%20story%20about%20your%20snap.%20Keep%20it%20under%20100%20words%20though%2C%0A%20%20%20%20we%20live%20in%20tweetspace%20and%20your%20description%20wants%20to%20look%20good%20in%20the%20snap%0A%20%20%20%20store.%0A%0A%20%20grade%3A%20devel%20%23%20must%20be%20%27stable%27%20to%20release%20into%20candidate%2Fstable%20channels%0A%20%20confinement%3A%20devmode%20%23%20use%20%27strict%27%20once%20you%20have%20the%20right%20plugs%20and%20slots%0A%0A%20%20parts%3A%0A%20%20%20%20my-part%3A%0A%20%20%20%20%20%20%23%20See%20%27snapcraft%20plugins%27%0A%20%20%20%20%20%20plugin%3A%20nil%0A%20%20`;
  }

  renderButton() {
    const { status } = this.state;
    if (
      status === ERROR ||
      status === SNAP_NAME_DOES_NOT_MATCH ||
      status === MISSING_YAML_FILE
    ) {
      return (
        <button
          className="p-tooltip--btm-center"
          aria-describedby="btm-cntr"
          onClick={this.handleRefreshButtonClick}
        >
          <i className="p-icon--restart" />
          <span className="p-tooltip__message" role="tooltip" id="btm-cntr">
            Re-check
          </span>
        </button>
      );
    } else if (status === SUCCESS) {
      return <Button appearance="positive">Start building</Button>;
    }
  }

  renderIcon() {
    const { status } = this.state;
    let icon;
    switch (status) {
      default:
        icon = "";
        break;
      case ERROR:
      case MISSING_YAML_FILE:
      case SNAP_NAME_DOES_NOT_MATCH:
        icon = " is-error";
        break;
      case SUCCESS:
        icon = " is-success";
        break;
    }
    return icon;
  }

  componentDidMount() {
    // Pre-select user's own "organization" if the user is not part of any organizations
    if (this.state.organizations.length === 2) {
      this.setState({ selectedOrganization: this.state.user.login }, () => {
        this.fetchRepoList();
      });
    }
  }

  render() {
    const {
      organizations,
      selectedOrganization,
      selectedRepo,
      isRepoListDisabled,
      repoList,
      status
    } = this.state;
    return (
      <Fragment>
        <div className="row">
          <div className="col-4">
            <input
              type="hidden"
              name="github_repository"
              value={`${selectedOrganization}/${selectedRepo}`}
            />
            <Select
              options={organizations}
              selectedOption={selectedOrganization}
              updateSelection={this.handleOrganiationSelect}
            />
          </div>
          <div className={`col-6 p-form-validation${this.renderIcon()}`}>
            <DatalistSelect
              options={repoList}
              selectedOption={selectedRepo}
              disabled={isRepoListDisabled}
              placeholder="Search your repos"
              updateSelection={this.handleRepoSelect}
              listId="repo-list"
              isLoading={status === "LOADING" ? true : false}
            />
          </div>
          <div className="col-2">{this.renderButton()}</div>
        </div>
        {this.renderMessage()}
      </Fragment>
    );
  }
}

RepoConnect.propTypes = {
  organizations: PropTypes.array,
  user: PropTypes.object,
  snapName: PropTypes.string
};

/**
 * Initialize the component if used outside of a react app
 *
 * Selector should be in the following format:
 * <div data-js="repo-connect">
 * </div>
 *
 * @param {HTMLElement} selector
 * @param {{name: string, key: string}[]} organizations
 * @param {login: string, name: string, avatarUrl: string} user
 * @param {string} snapName
 */
function init(selector, organizations, user, snapName) {
  const el = document.querySelector(selector);

  // Add user login to the organization list
  let _organizations = organizations.map(item => {
    return { value: item.login };
  });
  _organizations = [
    { value: "Select organization", disabled: true },
    { value: user.login },
    ..._organizations
  ];

  if (el) {
    // do the react
    ReactDOM.render(
      <RepoConnect
        organizations={_organizations}
        user={user}
        snapName={snapName}
      />,
      el
    );
  }
}

export { RepoConnect as default, init as initRepoConnect };
