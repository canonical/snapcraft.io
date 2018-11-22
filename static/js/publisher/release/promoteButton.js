import React, { Component } from "react";
import PropTypes from "prop-types";

import ContextualMenu from "./contextualMenu";

export default class PromoteButton extends Component {
  constructor(props) {
    super(props);
    this.setMenuRef = menu => (this.menu = menu);
  }

  promoteToChannelClick(targetChannel, event) {
    this.props.promoteToChannel(targetChannel);

    if (this.menu) {
      this.menu.itemClickHandler(event);
    }
  }

  renderItems() {
    const { track } = this.props;

    return (
      <span className="p-contextual-menu__group">
        <span className="p-contextual-menu__item">Promote to:</span>
        {this.props.targetRisks.map(targetRisk => {
          return (
            <a
              className="p-contextual-menu__link is-indented"
              href="#"
              key={`promote-to-${track}/${targetRisk}`}
              onClick={this.promoteToChannelClick.bind(
                this,
                `${track}/${targetRisk}`
              )}
            >
              {`${track}/${targetRisk}`}
            </a>
          );
        })}
      </span>
    );
  }

  render() {
    return (
      <ContextualMenu
        className="p-releases-channel__promote"
        icon="⤴"
        ref={this.setMenuRef}
      >
        {this.renderItems()}
      </ContextualMenu>
    );
  }
}

PromoteButton.propTypes = {
  track: PropTypes.string.isRequired,
  targetRisks: PropTypes.array.isRequired,
  promoteToChannel: PropTypes.func.isRequired
};
