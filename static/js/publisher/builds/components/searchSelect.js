import React from "react";
import PropTypes from "prop-types";

class SearchSelect extends React.Component {
  constructor(props) {
    super(props);
    ``;

    this.state = {
      values: this.props.values,
      searchTerm: "",
      searchResults: this.props.values,
      showSearch: false,
      highlightedOption: null
    };

    // Bind all the things
    // Clicking outside the component should hide the dropdown
    this.blur = this.blur.bind(this);
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.clickItem = this.clickItem.bind(this);
    this.addItem = this.addItem.bind(this);
    this.focusInput = this.focusInput.bind(this);
    this.search = this.search.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);
    this.clearAll = this.clearAll.bind(this);
  }

  sortByName(a, b) {
    return a.name.localeCompare(b.name);
  }

  /**
   * Remove an item from the 'selected' list.
   * Add it back into the 'values' list.
   */
  removeItem(key) {
    const { values } = this.state;
    const { selected } = this.props;
    const toRemove = selected.filter(item => item.key === key)[0];
    const newValues = values.slice(0);
    newValues.push(toRemove);
    newValues.sort(this.sortByName);
    const newSelected = selected.filter(item => item.key !== key);
    this.props.getSelectedItems(newSelected);
    this.setState(
      {
        values: newValues,
        // Preserve the filtered list in the dropdown
        searchResults: this.filterByTerm(newValues)
      },
      () => {
        this.focusInput();
      }
    );
  }

  /**
   * If an element is clicked, remove the highlightedOption before adding
   * the item to the 'selected' list.
   *
   * @param key
   */
  clickItem(key) {
    const { isMulti } = this.props;
    this.setState({
      highlightedOption: null
    });
    this.addItem(key);
    if (!isMulti) {
      this.blur();
    }
  }

  /**
   * Add an item to the 'selected' list.
   * Remove it from the 'values' list.
   */
  addItem(key) {
    // Get the object based on the key
    const { values } = this.state;
    const { isMulti, selected } = this.props;
    const toAdd = values.filter(item => item.key === key)[0];
    const newSelected = selected.slice(0);
    newSelected.push(toAdd);
    const newValues = values.filter(item => item.key !== key);
    this.searchInput.value = "";

    this.setState(
      {
        values: newValues,
        searchTerm: "",
        // Preserve the filtered list in the dropdown
        searchResults: newValues
      },
      () => {
        if (!isMulti) {
          this.blur();
        }
        this.props.getSelectedItems(newSelected);
      }
    );
  }

  /**
   * Filter a list by term
   *
   * @param values
   * @param searchTerm
   * @returns {{name: string, key: string}[]}
   */
  filterByTerm(values, searchTerm) {
    searchTerm = searchTerm || this.state.searchTerm;
    return values.filter(
      item =>
        item.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
        item.key.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }

  /**
   * Filter the 'values' list by the search term.
   */
  search(e) {
    const searchTerm = e.target.value;
    const searchResults = this.filterByTerm(this.state.values, searchTerm);
    let highlighted = this.state.highlightedOption;
    if (!highlighted || highlighted < 0) {
      highlighted = 0;
    } else if (highlighted > searchResults.length - 1) {
      highlighted = searchResults.length - 1;
    }

    this.setState({
      searchResults: searchResults,
      searchTerm: searchTerm,
      showSearch: true,
      highlightedOption: highlighted
    });
  }

  /**
   * Focus on the input
   */
  focusInput() {
    if (!this.props.disabled) {
      this.searchInput.focus();
      if (this.props.isMulti) {
        this.setState({
          showSearch: true,
          highlightedOption: this.state.highlightedOption || 0
        });
      } else {
        if (this.props.selected.length === 0) {
          this.setState({
            showSearch: true,
            highlightedOption: this.state.highlightedOption || 0
          });
        }
      }
    }
  }

  /**
   * Navigate the component with the keyboard.
   *
   * @param event
   */
  handleKeypress(event) {
    if (this.state.showSearch) {
      let highlighted = this.state.highlightedOption;
      let results = this.state.searchResults;

      switch (event.key) {
        case "ArrowDown":
          if (highlighted === null) {
            highlighted = 0;
          } else {
            highlighted += 1;
          }
          break;
        case "ArrowUp":
          if (highlighted > 0) {
            highlighted -= 1;
          }
          break;
        case "Enter":
          event.preventDefault();
          if (highlighted >= 0) {
            this.addItem(results[highlighted].key);
          }
          break;
        case "Backspace":
          if (this.props.selected.length > 0 && this.state.searchTerm === "") {
            this.removeItem(
              this.props.selected[this.props.selected.length - 1].key
            );
          }
          break;
        case "Tab":
          this.blur();
          break;
        default:
          break;
      }

      if (highlighted < 0) {
        highlighted = 0;
      }

      if (highlighted > results.length - 1) {
        highlighted = results.length - 1;
      }

      this.setState({
        highlightedOption: highlighted
      });
    }
  }

  /**
   * Clear all selected values
   */
  clearAll() {
    const toRemove = this.props.selected.slice(0);
    let newValues = this.state.values.slice(0);
    newValues = newValues.concat(toRemove);
    newValues.sort(this.sortByName);
    this.props.getSelectedItems([]);
    this.setState(
      {
        values: newValues,
        // Preserve the filtered list in the dropdown
        searchResults: newValues
      },
      () => {
        this.focusInput();
      }
    );
  }

  blur() {
    this.setState({
      showSearch: false
    });
  }

  /**
   * When clicking outside the component, blur the component
   * and update the original input
   *
   * @param event
   */
  handleClickOutside(event) {
    if (this.state.showSearch) {
      if (this.wrapperEl && !this.wrapperEl.contains(event.target)) {
        this.blur();
      }
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.values !== state.values) {
      return { values: props.values, searchResults: props.values };
    }
    return null;
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  /**
   * Update the scroll position of the dropdown when
   * using the arrow keys to scroll
   */
  componentDidUpdate() {
    if (this.wrapperEl) {
      const optionsHolder = this.wrapperEl.querySelector(
        ".p-search-select__options"
      );
      const selected = this.wrapperEl.querySelector(
        ".p-search-select__option.is-highlighted"
      );
      if (optionsHolder && selected) {
        const selectedTop = selected.offsetTop;
        const selectedHeight = selected.clientHeight;
        const selectedBottom = selectedTop + selectedHeight;
        const optionsHeight = optionsHolder.clientHeight;
        const optionsScroll = optionsHolder.scrollTop;
        const scrollBottom = optionsHeight + optionsScroll;
        if (selectedBottom > scrollBottom) {
          optionsHolder.scrollTop =
            optionsScroll + selectedBottom - scrollBottom;
        }
        if (selectedTop < optionsScroll) {
          optionsHolder.scrollTop = selectedTop;
        }
      }
    }
  }

  renderIcon() {
    const { iconType } = this.props;
    if (iconType) {
      return (
        <span className="p-search-select__icon">
          <i
            className={`p-icon--${iconType} ${
              iconType === "spinner" ? "u-animation--spin" : ""
            }`}
          />
        </span>
      );
    }
  }

  renderClear() {
    if (this.props.selected.length > 3 && this.state.showSearch) {
      return (
        <a className="p-search-select__clear" onClick={this.clearAll}>
          Clear all
        </a>
      );
    }
    return false;
  }

  renderSearch() {
    if (this.state.showSearch) {
      return (
        <ul className="p-search-select__options">
          {this.state.searchResults.map((item, i) => (
            <li
              className={`p-search-select__option${
                this.state.highlightedOption === i ? " is-highlighted" : ""
              }`}
              data-key={item.key}
              key={item.key}
              onClick={this.clickItem.bind(this, item.key)}
            >
              {item.name}
            </li>
          ))}
        </ul>
      );
    }
    return false;
  }

  renderItems() {
    const items = this.props.selected.map(value => (
      <span
        className="p-search-select__item"
        data-key={value.key}
        key={value.key}
      >
        {value.name}
        <i
          className="p-icon--close p-search-select__item-remove"
          onClick={this.removeItem.bind(this, value.key)}
        />
      </span>
    ));

    return items;
  }

  renderInput() {
    return (
      <input
        type="text"
        disabled={this.props.disabled ? "disabled" : ""}
        placeholder={this.props.placeholder}
        className={`p-search-select__input ${
          this.props.selected.length === 0 ? "" : "u-hide"
        }`}
        onKeyUp={this.search}
        ref={input => {
          this.searchInput = input;
        }}
      />
    );
  }

  render() {
    const { iconType } = this.props;
    return (
      <div
        ref={el => {
          this.wrapperEl = el;
        }}
      >
        {this.renderClear()}
        <div
          className={`p-search-select${
            this.state.showSearch ? " is-focused" : ""
          } ${iconType === "success" ? "is-success" : ""} ${
            iconType === "error" ? "is-error" : ""
          }`}
          onClick={this.focusInput}
          onKeyDown={this.handleKeypress}
        >
          {this.renderItems()}
          {this.renderInput()}
          {this.renderIcon()}
          {this.renderSearch()}
        </div>
      </div>
    );
  }
}

SearchSelect.defaultProps = {
  isMulti: false,
  disabled: false,
  iconType: "",
  placeholder: "",
  values: []
};

SearchSelect.propTypes = {
  values: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  placeholder: PropTypes.string,
  getSelectedItems: PropTypes.func,
  iconType: PropTypes.string
};

export default SearchSelect;
