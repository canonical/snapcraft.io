import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ContextualMenu from "./contextualMenu";

import { selectAvailableRevisions } from "../actions/availableRevisionsSelect";
import { getAvailableRevisionsBySelection } from "../selectors";

import {
  AVAILABLE_REVISIONS_SELECT_UNRELEASED,
  AVAILABLE_REVISIONS_SELECT_RECENT,
  AVAILABLE_REVISIONS_SELECT_ALL
} from "../constants";

const menuLabels = {
  [AVAILABLE_REVISIONS_SELECT_RECENT]: "Recent",
  [AVAILABLE_REVISIONS_SELECT_UNRELEASED]: "Unreleased",
  [AVAILABLE_REVISIONS_SELECT_ALL]: "All"
};

export class AvailableRevisionsMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  componentDidMount() {
    this.props.setValue(AVAILABLE_REVISIONS_SELECT_RECENT);
  }

  itemClick(value, event) {
    this.props.setValue(value);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItem(item) {
    const count = this.props.getFilteredCount(item);

    return (
      <a
        key={`available-menu-item-${item}`}
        className="p-contextual-menu__link"
        href="#"
        onClick={this.itemClick.bind(this, item)}
      >
        {menuLabels[item]} <span className="u-float--right">({count})</span>
      </a>
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
        label={menuLabels[this.props.value]}
        className="p-select-button"
        ref={this.setMenuRef}
        position="left"
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
