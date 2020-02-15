import React from "react";
import PropTypes from "prop-types";

class Select extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { options, updateSelection, disabled, selectedOption } = this.props;
    return (
      <div>
        <select
          onChange={e => updateSelection(e.target.value)}
          disabled={disabled}
          value={selectedOption}
        >
          {options.map((item, i) => (
            <option
              disabled={item.disabled}
              value={i === 0 ? "" : item.value}
              key={i}
            >
              {item.value}
            </option>
          ))}
        </select>
      </div>
    );
  }
}

Select.defaultProps = {
  disabled: false,
  selectedOption: ""
};

Select.propTypes = {
  options: PropTypes.array.isRequired,
  selectedOption: PropTypes.string,
  updateSelection: PropTypes.func,
  disabled: PropTypes.bool
};

export default Select;
