import React, { Fragment } from "react";
import PropTypes from "prop-types";

class AccordionHelp extends React.Component {
  constructor(props) {
    super(props);

    this.toggleHelp = this.toggleHelp.bind(this);

    this.state = {
      open: false,
    };
  }

  toggleHelp(e) {
    const { open } = this.state;

    e.preventDefault();
    this.setState({
      open: !open,
    });
  }

  render() {
    const { open } = this.state;
    const { name, children } = this.props;

    let label = `Hide ${name.toLowerCase()}`;
    if (!open) {
      label = `Show ${name.toLowerCase()}`;
    }

    return (
      <Fragment>
        <p className="p-form-help-text">
          <a href="#" role="button" tabIndex="0" onClick={this.toggleHelp}>
            {label}
          </a>
        </p>
        <div className={`${open ? "" : "u-hide"}`}>{children}</div>
      </Fragment>
    );
  }
}

AccordionHelp.defaultProps = {
  name: "help",
};

AccordionHelp.propTypes = {
  name: PropTypes.string,
  children: PropTypes.element,
};

export { AccordionHelp as default };
