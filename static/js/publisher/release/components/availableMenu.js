import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

import ContextualMenu from "./contextualMenu";

import { setAvailableSelect } from "../actions/availableSelect";

import {
  AVAILABLE_SELECT_UNRELEASED,
  AVAILABLE_SELECT_RECENT,
  AVAILABLE_SELECT_ALL
} from "../constants";

const menuLabels = {
  [AVAILABLE_SELECT_RECENT]: "Recent",
  [AVAILABLE_SELECT_UNRELEASED]: "Unreleased",
  [AVAILABLE_SELECT_ALL]: "All"
};

export class AvailableMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  itemClick(value, event) {
    this.props.setValue(value);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItems() {
    const items = Object.keys(menuLabels);

    return (
      <span className="p-contextual-menu__group">
        {items.map(item => (
          <a
            key={`available-menu-item-${item}`}
            className={`p-contextual-menu__link ${
              item === AVAILABLE_SELECT_RECENT ? "is-disabled" : ""
            }`}
            href="#"
            onClick={this.itemClick.bind(this, item)}
          >
            {menuLabels[item]}
          </a>
        ))}
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

AvailableMenu.propTypes = {
  value: PropTypes.string.isRequired,
  setValue: PropTypes.func.isRequired
};

const mapStateToProps = state => {
  return {
    value: state.availableSelect
  };
};

const mapDispatchToProps = dispatch => {
  return {
    setValue: value => dispatch(setAvailableSelect(value))
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AvailableMenu);
