import React from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";

import Button from "@canonical/react-components/dist/components/Button";
import SearchSelect from "./searchSelect";

class RepoConnect extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedRepo: [],
      repoList: [],
      selectedOrganization: "",
      organizations: this.props.organizations,
      user: this.props.user,
      isRepoListDisabled: true,
      searchIcon: "",
      snapName: this.props.snapName
    };

    this.updateRepoList = this.updateRepoList.bind(this);
    this.updateSelectedRepo = this.updateSelectedRepo.bind(this);
    this.handleOrgSelect = this.handleOrgSelect.bind(this);
    this.handleRefreshButtonClick = this.handleRefreshButtonClick.bind(this);
  }

  /**
   * Update selected repo from the searchSelect component
   *
   * @param organization
   */
  updateSelectedRepo(selectedRepo) {
    this.setState({ selectedRepo: selectedRepo }, () => {
      this.handleRepoSelect(this.state.selectedRepo);
    });
  }

  /**
   * Update repo list with repos of the selected organization
   *
   */
  updateRepoList() {
    const { selectedOrganization, user } = this.state;
    let url = "";

    if (selectedOrganization === user.login) {
      url = "/publisher/github/get-repos";
    } else {
      url = `/publisher/github/get-repos?org=${selectedOrganization}`;
    }
    this.setState({ isRepoListDisabled: true, searchIcon: "spinner" });

    fetch(url)
      .then(res => res.json())
      .then(result => {
        let newRepoList = result.map(el => {
          return {
            key: el.nameWithOwner.split("/")[1],
            name: el.nameWithOwner
          };
        });
        this.setState({
          repoList: newRepoList,
          isRepoListDisabled: false,
          searchIcon: ""
        });
      })
      .catch(() => {
        this.setState({ isRepoListDisabled: false, searchIcon: "" });
      });
  }

  // Handle organization select
  handleOrgSelect() {
    this.setState(
      { selectedOrganization: event.target.value, selectedRepo: [] },
      () => {
        this.updateRepoList();
      }
    );
  }

  /**
   * Handle repo select - update selectedRepo state and check if repo is valid to connect
   *
   * @param selectedRepo
   */
  handleRepoSelect(selectedRepo) {
    if (selectedRepo.length > 0) {
      const { snapName } = this.state;
      const url = `/${snapName}/builds/validate-repo?repo=${
        selectedRepo[0].name
      }`;

      this.setState({ isRepoListDisabled: true, searchIcon: "spinner" });

      fetch(url)
        .then(res => res.json())
        .then(result => {
          const newIcon = result.success ? "success" : "error";

          this.setState({
            isRepoListDisabled: false,
            searchIcon: newIcon
          });
        })
        .catch(() => {
          this.setState({
            isRepoListDisabled: false,
            searchIcon: "error"
          });
        });
    } else {
      this.setState({ selectedRepo: [], searchIcon: "" });
    }
  }

  // Handle Refresh button click
  handleRefreshButtonClick(e) {
    e.preventDefault();
    this.handleRepoSelect(this.state.selectedRepo);
  }

  // Render organization list
  renderOrganizations(organizations, user) {
    // Add user login to organization list
    let _organizations = [
      { login: "", name: "Select organization" },
      { login: user.login, name: user.name },
      ...organizations
    ];

    let renderedOrgs = _organizations.map((el, i) => {
      if (i === 0) {
        return (
          <option disabled="disabled" value="" key={el.login}>
            Select organization
          </option>
        );
      } else {
        return (
          <option value={el.login} key={el.login}>
            {el.login}
          </option>
        );
      }
    });
    return renderedOrgs;
  }

  renderButton() {
    const { searchIcon } = this.state;
    if (searchIcon === "error") {
      return (
        <Button appearance="neutral" onClick={this.handleRefreshButtonClick}>
          Try again
        </Button>
      );
    } else if (searchIcon === "success") {
      return <Button appearance="positive">Start building</Button>;
    }
  }

  componentDidMount() {
    // Pre-select user's own "organization" if the user is not part of any organizations
    if (this.state.organizations.length === 0) {
      this.setState({ selectedOrganization: this.state.user.login }, () => {
        this.updateRepoList();
      });
    }
  }

  render() {
    const {
      organizations,
      selectedOrganization,
      repoList,
      user,
      isRepoListDisabled,
      searchIcon,
      selectedRepo
    } = this.state;
    return (
      <div className="row">
        <div className="col-4">
          <input
            type="hidden"
            name="github_repository"
            value={selectedRepo.length > 0 ? selectedRepo[0].name : ""}
          />
          <select onChange={this.handleOrgSelect} value={selectedOrganization}>
            {this.renderOrganizations(organizations, user)}
          </select>
        </div>
        <div className="col-6">
          <SearchSelect
            disabled={isRepoListDisabled}
            selected={selectedRepo}
            values={repoList}
            getSelectedItems={this.updateSelectedRepo}
            placeholder="Search your repos"
            iconType={searchIcon}
          />
        </div>
        <div className="col-2">{this.renderButton()}</div>
      </div>
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

  if (el) {
    // do the react
    ReactDOM.render(
      <RepoConnect
        organizations={organizations}
        user={user}
        snapName={snapName}
      />,
      el
    );
  }
}

export { RepoConnect as default, init as initRepoConnect };
