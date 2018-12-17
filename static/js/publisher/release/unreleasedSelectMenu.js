import React, { Component } from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class UnreleasedSelectMenu extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  filterClick(filter, event) {
    this.props.filterSelect(filter);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItems() {
    const { filters } = this.props;

    let all = ["Unreleased", "Recent", ...filters];
    return (
      <span className="p-contextual-menu__group">
        {all.map(filter => (
          <a
            key={`unreleased-menu-item-${filter}`}
            className="p-contextual-menu__link"
            href="#"
            onClick={this.filterClick.bind(this, filter)}
          >
            {filter}
          </a>
        ))}
      </span>
    );
  }

  render() {
    const icon = (
      <span>
        {this.props.currentFilter} <i className="p-icon--chevron" />
      </span>
    );
    return (
      <ContextualMenu
        appearance="neutral"
        ref={this.setMenuRef}
        icon={icon}
        position="left"
      >
        {this.renderItems()}
      </ContextualMenu>
    );
  }
}

UnreleasedSelectMenu.propTypes = {
  currentFilter: PropTypes.string.isRequired,
  filters: PropTypes.array.isRequired,
  filterSelect: PropTypes.func.isRequired
};
