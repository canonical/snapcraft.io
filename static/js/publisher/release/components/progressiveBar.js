import React from "react";
import PropTypes from "prop-types";

class ProgressiveBar extends React.Component {
  constructor(props) {
    super(props);

    this.barHolder = React.createRef();

    this.state = {
      current: props.percentage,
      target: props.percentage,
      scrubTarget: props.percentage,
      scrubbing: false,
      mousePosition: 0
    };

    this.onMouseUpHandler = this.onMouseUpHandler.bind(this);
    this.onMouseDownHandler = this.onMouseDownHandler.bind(this);
    this.onMouseMoveHandler = this.onMouseMoveHandler.bind(this);

    this.onWheelHandler = this.onWheelHandler.bind(this);

    window.addEventListener("mouseup", this.onMouseUpHandler);
    window.addEventListener("mousemove", this.onMouseMoveHandler);
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.onMouseUpHandler);
    window.removeEventListener("mousemove", this.onMouseMoveHandler);
  }

  scrubTo(target, setTarget) {
    const { current } = this.state;
    const { singleDirection } = this.props;

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
    const { scrubTarget } = this.state;
    const direction = e.nativeEvent.deltaY > 0 ? -1 : 1;
    this.scrubTo(Math.round(scrubTarget + direction), true);
  }

  render() {
    const { readonly, inputName } = this.props;
    const { current, target, scrubTarget, scrubbing } = this.state;
    const classes = ["progressive-bar p-tooltip--btm-center"];
    if (scrubbing) {
      classes.push("is-scrubbing");
    }
    if (!readonly) {
      classes.push("is-interactive");
    }
    return (
      <div
        className={classes.join(" ")}
        ref={this.barHolder}
        onMouseDown={!readonly && this.onMouseDownHandler}
        onWheel={!readonly && this.onWheelHandler}
      >
        {!readonly && (
          <div
            className="progressive-bar__target"
            style={{ width: `${scrubTarget}%` }}
          >
            <div className="progressive-bar__target-adjust" />
          </div>
        )}
        <div
          className="progressive-bar__target-value"
          style={{
            left: `${scrubTarget}%`
          }}
        >
          <span className="p-tooltip__message" role="tooltip">
            {scrubTarget}%
          </span>
        </div>
        <div
          className="progressive-bar__current"
          style={{ width: `${current}%` }}
        />
        <input type="hidden" name={inputName} value={target} />
      </div>
    );
  }
}

ProgressiveBar.propTypes = {
  inputName: PropTypes.string,
  percentage: PropTypes.number,
  readonly: PropTypes.bool,
  singleDirection: PropTypes.number
};

export default ProgressiveBar;
