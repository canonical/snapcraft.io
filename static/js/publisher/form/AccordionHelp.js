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
    let label = `Hide ${name.toLowerCase()}`;
    if (!open) {
      classNames.push("u-hide");
      label = `Show ${name.toLowerCase()}`;
    }

    return (
      <Fragment>
        <p className="p-form-help-text u-no-margin--bottom">
          <a role="button" onClick={this.toggleHelp}>
            {label}
          </a>
        </p>
        <div className={classNames.join(" ")}>{children}</div>
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
