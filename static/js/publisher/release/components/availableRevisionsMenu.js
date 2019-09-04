import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ContextualMenu from "./contextualMenu";

import { selectAvailableRevisions } from "../actions/availableRevisionsSelect";
import { getAvailableRevisionsBySelection } from "../selectors";

import {
  AVAILABLE_REVISIONS_SELECT_LAUNCHPAD,
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_ALL
} from "../constants";

const menuLabels = {
  [AVAILABLE_REVISIONS_SELECT_RECENT]: {
    label: "Recent",
    description:
      "Revisions from past week not released in any channel with most recent version"
  },
  [AVAILABLE_REVISIONS_SELECT_UNRELEASED]: {
    label: "Unreleased",
    description: "Revisions not released to any channel"
  },
  [AVAILABLE_REVISIONS_SELECT_LAUNCHPAD]: {
    label: "Launchpad",
    description: "Revisions built on Launchpad"
  },
  [AVAILABLE_REVISIONS_SELECT_ALL]: {
    label: "All revisions"
  }
};

export class AvailableRevisionsMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  componentDidMount() {
    const { setValue, getFilteredCount } = this.props;

    if (getFilteredCount(AVAILABLE_REVISIONS_SELECT_RECENT) > 0) {
      setValue(AVAILABLE_REVISIONS_SELECT_RECENT);
    } else if (getFilteredCount(AVAILABLE_REVISIONS_SELECT_UNRELEASED) > 0) {
      setValue(AVAILABLE_REVISIONS_SELECT_UNRELEASED);
    } else {
      setValue(AVAILABLE_REVISIONS_SELECT_ALL);
    }
  }

  itemClick(value, event) {
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.stopImmediatePropagation();
    event.nativeEvent.preventDefault();

    this.props.setValue(value);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItem(item) {
    const count = this.props.getFilteredCount(item);
    const isDisabled = count === 0;
    const className = `p-contextual-menu__link ${
      isDisabled ? "is-disabled" : ""
    }`;

    return (
      <span
        key={`available-menu-item-${item}`}
        className={className}
        onClick={!isDisabled ? this.itemClick.bind(this, item) : undefined}
      >
        {menuLabels[item].label}{" "}
        <span className="u-float-right">({count})</span>
        {menuLabels[item].description && (
          <span className="p-contextual-menu__description">
            {menuLabels[item].description}
          </span>
        )}
      </span>
    );
  }

  renderItems() {
    const items = Object.keys(menuLabels);

    return (
      <span className="p-contextual-menu__group">
        {items.map(this.renderItem.bind(this))}
      </span>
    );
  }

  render() {
    return (
      <ContextualMenu
        label={menuLabels[this.props.value].label}
        className="p-select-button"
        ref={this.setMenuRef}
        position="left"
        isWide={true}
      >
        {this.renderItems()}
      </ContextualMenu>
    );
  }
}

AvailableRevisionsMenu.propTypes = {
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired,
  getFilteredCount: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    value: state.availableRevisionsSelect,
    getFilteredCount: value =>
      getAvailableRevisionsBySelection(state, value).length
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setValue: value => dispatch(selectAvailableRevisions(value))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AvailableRevisionsMenu);
