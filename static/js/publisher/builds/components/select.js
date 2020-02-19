import React, { Fragment } from "react";
import PropTypes from "prop-types";

const Select = ({ options, updateSelection, disabled, selectedOption }) => (
  <Fragment>
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
  </Fragment>
);

Select.propTypes = {
  options: PropTypes.array.isRequired,
  selectedOption: PropTypes.string,
  updateSelection: PropTypes.func,
  disabled: PropTypes.bool
};

export default Select;
