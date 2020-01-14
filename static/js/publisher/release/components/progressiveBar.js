import React from "react";
import PropTypes from "prop-types";

const ProgressiveBar = ({
  percentage,
  targetPercentage,
  readonly,
  disabled
}) => {
  let current = percentage;

  // If the target can move below the current percentage
  // use the main percentage bar to show the position
  // (the target bar is behind the main bar)
  if (targetPercentage < current) {
    current = targetPercentage;
  }

  return (
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
        style={{ width: `${current}%` }}
      />
    </div>
  );
};

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
      scrubTarget: props.targetPercentage || props.percentage,
      scrubStart: null,
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

  // Ensure that if the targetPercentage is changed,
  // it overrides the scrubTarget state
  static getDerivedStateFromProps(props, state) {
    const newState = { ...state };
    if (props.targetPercentage !== state.scrubTarget) {
      newState.scrubTarget = props.targetPercentage;
    }

    return newState;
  }

  // This is here because of https://github.com/facebook/react/issues/6436
  componentDidMount() {
    const { disabled } = this.props;
    if (!disabled) {
      this.barHolder.current.addEventListener("wheel", this.onWheelHandler);
    }
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.onMouseUpHandler);
    window.removeEventListener("mousemove", this.onMouseMoveHandler);
    this.barHolder.current.removeEventListener("wheel", this.onWheelHandler);
  }

  componentDidUpdate(prevProps) {
    const { disabled: prevDisabled } = prevProps;
    const { disabled: nextDisabled } = this.props;

    // We really don't want to flood the browser with event listeners
    if (prevDisabled && !nextDisabled) {
      // was disabled, now isn't
      window.addEventListener("mouseup", this.onMouseUpHandler);
      window.addEventListener("mousemove", this.onMouseMoveHandler);
    } else if (!prevDisabled && nextDisabled) {
      // wasn't disabled, now is
      window.removeEventListener("mouseup", this.onMouseUpHandler);
      window.removeEventListener("mousemove", this.onMouseMoveHandler);
    }
  }

  scrubTo(target) {
    const { current } = this.state;
    const { singleDirection, onChange, minPercentage } = this.props;

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

    if (minPercentage && target < minPercentage) {
      target = minPercentage;
    }

    const newState = {
      scrubTarget: target
    };

    this.setState(newState);
    onChange(target);
  }

  onMouseDownHandler(e) {
    this.setState({
      mousePosition: e.clientX,
      scrubStart: this.state.scrubTarget
    });
  }

  onMouseMoveHandler(e) {
    const { mousePosition, scrubStart } = this.state;
    if (!scrubStart) {
      return;
    }
    const width = this.barHolder.current.clientWidth;
    const diff = e.clientX - mousePosition;
    const diffPercentage = Math.round((diff / width) * 100);

    this.scrubTo(scrubStart + diffPercentage);
  }

  onMouseUpHandler() {
    const { scrubStart } = this.state;
    if (!scrubStart) {
      return;
    }
    this.setState({
      scrubStart: null
    });
  }

  onWheelHandler(e) {
    e.preventDefault();
    const { scrubTarget } = this.state;
    const direction = e.deltaY > 0 ? -1 : 1;
    this.scrubTo(Math.round(scrubTarget + direction));
  }

  render() {
    const { disabled, singleDirection } = this.props;
    const { current, scrubTarget, scrubStart } = this.state;
    const classes = ["progressive-bar__interactive-wrapper"];
    if (scrubStart) {
      classes.push("is-scrubbing");
    }

    classes.push("is-interactive");

    let currentAndTargetEqual = false;
    if (!singleDirection || singleDirection === 0) {
      currentAndTargetEqual = true;
    }

    return (
      <div
        className={classes.join(" ")}
        ref={this.barHolder}
        onMouseDown={!disabled ? this.onMouseDownHandler : undefined}
      >
        <ProgressiveBar
          percentage={currentAndTargetEqual ? scrubTarget : current}
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
  disabled: PropTypes.bool,
  minPercentage: PropTypes.number
};

export { ProgressiveBar, InteractiveProgressiveBar };
