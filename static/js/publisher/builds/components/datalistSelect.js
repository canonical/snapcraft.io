import React, { Fragment } from "react";
import PropTypes from "prop-types";

const DatalistSelect = ({
  placeholder,
  options,
  updateSelection,
  disabled,
  selectedOption,
  listId,
  isLoading
}) => (
  <Fragment>
    <input
      type="text"
      list={listId}
      onChange={e => updateSelection(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      value={selectedOption}
      className="p-form-validation__input"
    />
    {isLoading ? (
      <span className="p-icon-container">
        <i className="p-icon--spinner u-animation--spin" />
      </span>
    ) : (
      ""
    )}
    <datalist id={listId}>
      {options.map((item, i) => (
        <option value={item.value} key={i} />
      ))}
    </datalist>
  </Fragment>
);

DatalistSelect.propTypes = {
  options: PropTypes.array.isRequired,
  selectedOption: PropTypes.string,
  updateSelection: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  listId: PropTypes.string,
  className: PropTypes.string
};

export default DatalistSelect;
