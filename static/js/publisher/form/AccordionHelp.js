import React, { Fragment } from "react";
import PropTypes from "prop-types";

class AccordionHelp extends React.Component {
  constructor(props) {
    super(props);

    this.toggleHelp = this.toggleHelp.bind(this);

    this.state = {
      open: false
    };
  }

  toggleHelp() {
    const { open } = this.state;

    this.setState({
      open: !open
    });
  }

  render() {
    const { open } = this.state;
    const { name, children } = this.props;

    const classNames = ["row"];
    let verb = "Hide";
    if (!open) {
      classNames.push("u-hide");
      verb = "Show";
    }

    return (
      <Fragment>
        <p className={`p-form-help-text ${open ? "u-no-margin--bottom" : ""}`}>
          <a role="button" onClick={this.toggleHelp}>
            {verb} {name.toLowerCase()}
          </a>
        </p>
        <div className={classNames.join(" ")}>
          <div className="col-8">{children}</div>
        </div>
      </Fragment>
    );
  }
}

AccordionHelp.defaultProps = {
  name: "help"
};

AccordionHelp.propTypes = {
  name: PropTypes.string,
  children: PropTypes.element
};

export { AccordionHelp as default };
