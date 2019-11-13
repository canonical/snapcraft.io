import React from "react";
import PropTypes from "prop-types";

const ProgressiveBar = ({
  percentage,
  targetPercentage,
  readonly,
  disabled
}) => (
  <div
    className={`progressive-bar p-tooltip--btm-center ${
      disabled ? "is-disabled" : ""
    }`}
  >
    {!readonly && (
      <div
        className="progressive-bar__target"
        style={{ width: `${targetPercentage}%` }}
      >
        <div className="progressive-bar__target-adjust" />
      </div>
    )}
    <div
      className="progressive-bar__target-value"
      style={{
        left: `${targetPercentage ? targetPercentage : percentage}%`
      }}
    >
      <span className="p-tooltip__message" role="tooltip">
        {targetPercentage ? targetPercentage : percentage}%
      </span>
    </div>
    <div
      className="progressive-bar__current"
      style={{ width: `${percentage}%` }}
    />
  </div>
);

ProgressiveBar.defaultProps = {
  readonly: true
};

ProgressiveBar.propTypes = {
  percentage: PropTypes.number,
  targetPercentage: PropTypes.number,
  readonly: PropTypes.bool,
  disabled: PropTypes.bool
};

class InteractiveProgressiveBar extends React.Component {
  constructor(props) {
    super(props);

    this.barHolder = React.createRef();

    this.state = {
      current: props.percentage,
      target: props.percentage,
      scrubTarget: props.targetPercentage || props.percentage,
      scrubbing: false,
      mousePosition: 0
    };

    this.onMouseUpHandler = this.onMouseUpHandler.bind(this);
    this.onMouseDownHandler = this.onMouseDownHandler.bind(this);
    this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);

    this.onWheelHandler = this.onWheelHandler.bind(this);

    // If the element isn't disabled, add event liteners
    if (!props.disabled) {
      window.addEventListener("mouseup", this.onMouseUpHandler);
      window.addEventListener("mousemove", this.onMouseMoveHandler);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.onMouseUpHandler);
    window.removeEventListener("mousemove", this.onMouseMoveHandler);
  }

  componentDidUpdate(prevProps, prevState) {
    const { disabled: prevDisabled } = prevProps;
    const { scrubTarget } = prevState;
    const { disabled: nextDisabled, targetPercentage } = this.props;
    // We really don't want to flood the browser with event listeners
    if (prevDisabled && !nextDisabled) {
      window.addEventListener("mouseup", this.onMouseUpHandler);
      window.addEventListener("mousemove", this.onMouseMoveHandler);
    } else if (!prevDisabled && nextDisabled) {
      window.removeEventListener("mouseup", this.onMouseUpHandler);
      window.removeEventListener("mousemove", this.onMouseMoveHandler);
    }

    if (scrubTarget !== targetPercentage) {
      this.setState({
        scrubTarget: targetPercentage
      });
    }
  }

  scrubTo(target, setTarget) {
    const { current } = this.state;
    const { singleDirection, onChange } = this.props;

    if (singleDirection && singleDirection > 0) {
      if (target < current) {
        target = current;
      }

      if (target > 100) {
        target = 100;
      }
    } else if (singleDirection && singleDirection < 0) {
      if (target < 0) {
        target = 0;
      }

      if (target > current) {
        target = current;
      }
    } else {
      if (target < 0) {
        target = 0;
      }

      if (target > 100) {
        target = 100;
      }
    }

    const newState = {
      scrubTarget: target
    };

    if (setTarget) {
      newState.target = target;
    }

    this.setState(newState);
    onChange(target);
  }

  onMouseDownHandler(e) {
    this.setState({
      mousePosition: e.clientX,
      scrubbing: true
    });
  }

  onMouseMoveHandler(e) {
    const { mousePosition, scrubbing, target } = this.state;
    if (!scrubbing) {
      return;
    }
    const diff = e.clientX - mousePosition;
    const width = this.barHolder.current.clientWidth;
    this.scrubTo(Math.round(target + (diff / width) * 100));
  }

  onMouseUpHandler() {
    const { scrubbing, scrubTarget } = this.state;
    if (!scrubbing) {
      return;
    }
    this.setState({
      scrubbing: false,
      target: scrubTarget
    });
  }

  onWheelHandler(e) {
    e.preventDefault();
    const { scrubTarget } = this.state;
    const direction = e.nativeEvent.deltaY > 0 ? -1 : 1;
    this.scrubTo(Math.round(scrubTarget + direction), true);
  }

  render() {
    const { disabled } = this.props;
    const { current, scrubTarget, scrubbing } = this.state;
    const classes = ["progressive-bar__interactive-wrapper"];
    if (scrubbing) {
      classes.push("is-scrubbing");
    }

    classes.push("is-interactive");

    return (
      <div
        className={classes.join(" ")}
        ref={this.barHolder}
        onMouseDown={!disabled ? this.onMouseDownHandler : undefined}
        onWheel={!disabled ? this.onWheelHandler : undefined}
      >
        <ProgressiveBar
          percentage={current}
          targetPercentage={scrubTarget}
          readonly={false}
          disabled={disabled}
        />
      </div>
    );
  }
}

InteractiveProgressiveBar.propTypes = {
  percentage: PropTypes.number,
  singleDirection: PropTypes.number,
  onChange: PropTypes.func,
  targetPercentage: PropTypes.number,
  disabled: PropTypes.bool
};

export { ProgressiveBar, InteractiveProgressiveBar };
