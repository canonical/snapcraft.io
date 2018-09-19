import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class PromoteButton extends Component {
  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener('click', this.closeAllDropdowns);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.closeAllDropdowns);
  }

  promoteChannelClick(targetChannel, event) {
    this.props.promoteChannel(targetChannel);
    this.closeAllDropdowns();
    event.preventDefault(); // prevent link from changing URL
    event.stopPropagation(); // prevent event from propagating to parent button and opening dropdown again
  }

  dropdownButtonClick(event) {
    this.closeAllDropdowns();
    const dropdownEl = event.target
      .closest('.p-promote-button')
      .querySelector('.p-contextual-menu__dropdown');

    if (dropdownEl) {
      dropdownEl.setAttribute('aria-hidden', false);
    }

    event.stopPropagation();
  }

  closeAllDropdowns() {
    [].slice.call(document.querySelectorAll(".p-contextual-menu__dropdown")).forEach((dropdown) => {
      dropdown.setAttribute('aria-hidden', true);
    });
  }

  render() {
    const { track } = this.props;

    return (
      <button
        className="p-promote-button p-button--base p-icon-button p-contextual-menu--left"

        onClick={this.dropdownButtonClick.bind(this)}
      >
        <i className="p-icon--contextual-menu"></i>
        <span className="p-contextual-menu__dropdown" aria-hidden="true">
          <span className="p-contextual-menu__group">
            <span className="p-contextual-menu__item">Promote to:</span>
            {
              this.props.targetRisks.map((targetRisk) => {
                return (
                  <a
                    className="p-contextual-menu__link is-indented"
                    href="#"
                    key={`promote-to-${track}/${targetRisk}`}
                    onClick={this.promoteChannelClick.bind(this, `${track}/${targetRisk}`)}
                  >
                    {`${track}/${targetRisk}`}
                  </a>
                );
              })
            }
          </span>
        </span>
      </button>
    );
  }
}

PromoteButton.propTypes = {
  track: PropTypes.string.isRequired,
  targetRisks: PropTypes.array.isRequired,
  promoteChannel: PropTypes.func.isRequired
};
