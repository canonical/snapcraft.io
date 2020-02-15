import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import Button from "@canonical/react-components/dist/components/Button";
import DatalistSelect from "./datalistSelect";
import Select from "./select";

class RepoConnect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedRepo: "",
      repoList: [{ value: "someName" }, { value: "someOtherName" }],
      selectedOrganization: "",
      organizations: this.props.organizations,
      user: this.props.user,
      isRepoListDisabled: true,
      message: { icon: "", description: "" },
      snapName: this.props.snapName
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
        message: { icon: "", description: "" }
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
      message: { icon: "spinner", description: "" }
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
          message: { icon: "", description: "" }
        });
      })
      .catch(() => {
        this.setState({
          isRepoListDisabled: false,
          message: {
            icon: "error",
            description:
              "There was an error fetching your repository list. Please try again."
          }
        });
      });
  }

  /**
   * Check if repository is suitable for buld
   *
   * @param selectedRepo
   */
  checkRepo(selectedRepo) {
    const { snapName, repoList, selectedOrganization } = this.state;
    if (selectedRepo && repoList.some(el => el.value === selectedRepo)) {
      const url = `/${snapName}/builds/validate-repo?repo=${selectedOrganization}/${selectedRepo}`;

      this.setState({
        isRepoListDisabled: true,
        message: { icon: "spinner", description: "" }
      });

      fetch(url)
        .then(res => res.json())
        .then(result => {
          this.setState({
            isRepoListDisabled: false,
            message: {
              icon: result.success ? "success" : "error",
              description: result.success ? "" : result.error.message
            }
          });
        })
        .catch(() => {
          this.setState({
            isRepoListDisabled: false,
            message: {
              icon: "error",
              description:
                "An error occured while checking your repository. Please try again."
            }
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
    const { message } = this.state;
    if (message) {
      return (
        <div className="u-fixed-width">
          <p>{message.description}</p>
        </div>
      );
    }
  }

  getTemplateUrl() {
    const { selectedOrganization, snapName } = this.state;
    return `https://github.com/${selectedOrganization}/${snapName}/new/master?filename=snap%2Fsnapcraft.yaml&value=%0A%20%20%23%20After%20registering%20a%20name%20on%20build.snapcraft.io%2C%20commit%20an%20uncommented%20line%3A%0A%20%20%23%20name%3A%20${snapName}%0A%20%20version%3A%20%270.1%27%20%23%20just%20for%20humans%2C%20typically%20%271.2%2Bgit%27%20or%20%271.3.2%27%0A%20%20summary%3A%20Single-line%20elevator%20pitch%20for%20your%20amazing%20snap%20%23%2079%20char%20long%20summary%0A%20%20description%3A%20%7C%0A%20%20%20%20This%20is%20my-snap%27s%20description.%20You%20have%20a%20paragraph%20or%20two%20to%20tell%20the%0A%20%20%20%20most%20important%20story%20about%20your%20snap.%20Keep%20it%20under%20100%20words%20though%2C%0A%20%20%20%20we%20live%20in%20tweetspace%20and%20your%20description%20wants%20to%20look%20good%20in%20the%20snap%0A%20%20%20%20store.%0A%0A%20%20grade%3A%20devel%20%23%20must%20be%20%27stable%27%20to%20release%20into%20candidate%2Fstable%20channels%0A%20%20confinement%3A%20devmode%20%23%20use%20%27strict%27%20once%20you%20have%20the%20right%20plugs%20and%20slots%0A%0A%20%20parts%3A%0A%20%20%20%20my-part%3A%0A%20%20%20%20%20%20%23%20See%20%27snapcraft%20plugins%27%0A%20%20%20%20%20%20plugin%3A%20nil%0A%20%20`;
  }

  renderNoYamlInfo() {
    if (
      this.state.message.description ===
      "This repo needs a snapcraft.yaml file, so that Snapcraft can make it buildable, installable and runnable."
    ) {
      return (
        <div className="u-fixed-width">
          <p>
            <a href="https://snapcraft.io/docs/creating-a-snap">
              Learn the basics
            </a>
            , or{" "}
            <a href={this.getTemplateUrl()}>get started with a template.</a>
          </p>
          <p>
            Don’t have snapcraft?{" "}
            <a href="https://snapcraft.io/docs/snapcraft-overview">
              Install it on your own PC for testing.
            </a>
          </p>
        </div>
      );
    }
  }

  renderIcon() {
    const { message } = this.state;
    if (message.icon) {
      return (
        <span className="p-build__icon">
          <i
            className={`p-icon--${message.icon}${
              message.icon === "spinner" ? " u-animation--spin" : ""
            }`}
          />
        </span>
      );
    }
  }

  renderButton() {
    const { message } = this.state;
    if (message.icon === "error") {
      return (
        <Button onClick={this.handleRefreshButtonClick}>
          <i className="p-icon--restart" />
        </Button>
      );
    } else if (message.icon === "success") {
      return <Button appearance="positive">Start building</Button>;
    }
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
      message
    } = this.state;
    return (
      <Fragment>
        <div className="row">
          <div className="col-4">
            {/* <input
            type="hidden"
            name="github_repository"
            value={selectedRepo.length > 0 ? selectedRepo[0].name : ""}
          /> */}
            <Select
              options={organizations}
              selectedOption={selectedOrganization}
              updateSelection={this.handleOrganiationSelect}
            />
          </div>
          <div className="col-6 p-build-container">
            <DatalistSelect
              options={repoList}
              selectedOption={selectedRepo}
              disabled={isRepoListDisabled}
              placeholder="Search your repos"
              updateSelection={this.handleRepoSelect}
              listId="repo-list"
              className={
                message.icon === "error" || message.icon === "success"
                  ? `is-${message.icon}`
                  : ""
              }
            />
            {this.renderIcon()}
          </div>
          <div className="col-2">{this.renderButton()}</div>
        </div>
        {this.renderMessage()}
        {this.renderNoYamlInfo()}
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
