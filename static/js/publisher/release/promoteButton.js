import React, { Component } from 'react';
import PropTypes from 'prop-types';

const RISKS = ['stable', 'candidate', 'beta', 'edge'];

export default class PromoteButton extends Component {
  componentDidMount() {
    // use window instead of document, as React catches all events in document
    window.addEventListener('click', this.closeAllDropdowns);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.closeAllDropdowns);
  }

  promoteChannelClick(channel, targetChannel, event) {
    this.props.promoteChannel(channel, targetChannel);
    this.closeAllDropdowns();
    event.preventDefault(); // prevent link from changing URL
    event.stopPropagation(); // prevent event from propagating to parent button and opening dropdown again
  }

  dropdownButtonClick(event) {
    this.closeAllDropdowns();
    const controlId = event.target.closest('[aria-controls]').getAttribute('aria-controls');

    if (controlId) {
      const controlsEl = document.getElementById(controlId);
      controlsEl.setAttribute('aria-hidden', false);
    }

    event.stopPropagation();
  }

  closeAllDropdowns() {
    [].slice.call(document.querySelectorAll(".p-contextual-menu__dropdown")).forEach((dropdown) => {
      dropdown.setAttribute('aria-hidden', true);
    });
  }

  render() {
    const { track, risk } = this.props;
    const channel = `${track}/${risk}`;

    const dropdownId = `promote-dropdown-${channel}`;

    return (
      <button
        className="p-button--base p-icon-button p-contextual-menu--left"
        aria-controls={dropdownId}
        onClick={this.dropdownButtonClick.bind(this)}
      >
        <i className="p-icon--contextual-menu"></i>
        <span className="p-contextual-menu__dropdown" id={dropdownId} aria-hidden="true">
          <span className="p-contextual-menu__group">
            <span className="p-contextual-menu__item">Promote to:</span>
            {
              RISKS.map((targetRisk, i) => {
                if (i < RISKS.indexOf(risk)) {
                  return (
                    <a
                      className="p-contextual-menu__link is-indented"
                      href="#"
                      key={`promote-to-${track}/${targetRisk}`}
                      onClick={this.promoteChannelClick.bind(this, channel, `${track}/${targetRisk}`)}
                    >
                      {`${track}/${targetRisk}`}
                    </a>
                  );
                } else {
                  return null;
                }
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
  risk: PropTypes.string.isRequired,
  // TODO: only needed when not computing tracks from risk (?)
  // targetChannels: PropTypes.array.isRequired,
  promoteChannel: PropTypes.func.isRequired
};
