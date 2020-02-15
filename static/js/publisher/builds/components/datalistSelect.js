import React, { Fragment } from "react";
import PropTypes from "prop-types";

class DatalistSelect extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      placeholder,
      options,
      updateSelection,
      disabled,
      selectedOption,
      listId,
      className
    } = this.props;
    return (
      <Fragment>
        <input
          type="text"
          list={listId}
          onChange={e => updateSelection(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          value={selectedOption}
          className={className}
        />
        <datalist id={listId}>
          {options.map((item, i) => (
            <option value={item.value} key={i} />
          ))}
        </datalist>
      </Fragment>
    );
  }
}

DatalistSelect.defaultProps = {
  disabled: false,
  placeholder: "",
  selectedOption: "",
  listId: "options",
  className: ""
};

DatalistSelect.propTypes = {
  options: PropTypes.array.isRequired,
  selectedOption: PropTypes.string,
  updateSelection: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  listId: PropTypes.string,
  className: PropTypes.string
};

export default DatalistSelect;
