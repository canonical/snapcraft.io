import React  from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class MultiSelect extends React.Component {
  constructor(props) {
    super(props);

    // hide the original input
    this.props.input.style.display = 'none';

    // If there's anything in the current input, use it
    // split a list of , seperated strings to an array
    let currentValue = this.props.input.value.split(',');

    // If a currentValue exists, trim the whitespace
    if (currentValue.length > 0) {
      currentValue = currentValue.map(val => val.trim());
    } else {
      currentValue = null;
    }

    // The available values should be the full list minus the current values
    // sorted by name
    const values = this.props.values.filter(
      value => !currentValue.includes(value.key)
    ).sort(this.sortByName);

    this.state = {
      // Get the correct objects for the currentValues as selected
      selected: this.props.values.filter(value => currentValue.includes(value.key)),
      values: values,
      searchTerm: '',
      searchResults: values,
      showSearch: false,
      highlightedOption: null
    };

    // Bind all the things
    // Clicking outside the component should hide the dropdown
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.removeItem = this.removeItem.bind(this);
    this.clickItem = this.clickItem.bind(this);
    this.addItem = this.addItem.bind(this);
    this.focusInput = this.focusInput.bind(this);
    this.search = this.search.bind(this);
    this.handleKeypress = this.handleKeypress.bind(this);
    this.updateInputValue = this.updateInputValue.bind(this);
  }

  sortByName(a, b) {
    return a.name.localeCompare(b.name);
  }

  /**
   * Remove an item from the 'selected' list.
   * Add it back into the 'values' list.
   */
  removeItem(key) {
    const toRemove = this.state.selected.filter(item => item.key === key)[0];
    const newValues = this.state.values.slice(0);
    newValues.push(toRemove);
    newValues.sort(this.sortByName);
    const newSelected = this.state.selected.filter(item => item.key !== key);

    this.setState({
      values: newValues,
      selected: newSelected,
      // Preserve the filtered list in the dropdown
      searchResults: this.filterByTerm(newValues)
    }, this.updateInputValue);
  }

  /**
   * If an element is clicked, remove the highlightedOption before adding
   * the item to the 'selected' list.
   *
   * @param key
   */
  clickItem(key) {
    this.setState({
      highlightedOption: null
    });
    this.addItem(key);
  }

  /**
   * Add an item to the 'selected' list.
   * Remove it from the 'values' list.
   */
  addItem(key) {
    // Get the object based on the key
    const toAdd = this.state.values.filter(item => item.key === key)[0];
    const newSelected = this.state.selected.slice(0);
    newSelected.push(toAdd);
    const newValues = this.state.values.filter(item => item.key !== key);
    this.searchInput.value = '';

    this.setState({
      values: newValues,
      selected: newSelected,
      searchTerm: '',
      // Preserve the filtered list in the dropdown
      searchResults: newValues
    }, this.updateInputValue);
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
    return values.filter(item => item.name.toLowerCase().startsWith(searchTerm.toLowerCase()));
  }

  /**
   * Filter the 'values' list by the search term.
   */
  search(e) {
    const searchTerm = e.target.value;
    const searchResults = this.filterByTerm(this.state.values, searchTerm);
    let highlighted = this.state.highlightedOption;
    if (highlighted) {
      if (highlighted > searchResults.length - 1) {
        highlighted = searchResults.length - 1;
      }
      if (highlighted < 0) {
        highlighted = 0;
      }
    }

    this.setState({
      searchResults: searchResults,
      searchTerm: searchTerm,
      showSearch: true,
      highlightedOption: highlighted
    });
  }

  /**
   * Update the original input value and dispatch a change event to the input and form.
   */
  updateInputValue() {
    this.props.input.value = this.state.selected.map(item => item.key).join(', ');
    const changeEvent = new Event('change',  { 'bubbles': true });

    this.props.input.dispatchEvent(changeEvent);
  }

  /**
   * Focus on the input
   */
  focusInput() {
    this.searchInput.focus();
    this.setState({
      showSearch: true
    });
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
        case 'ArrowDown':
          if (highlighted === null) {
            highlighted = 0;
          } else {
            highlighted += 1;
          }
          break;
        case 'ArrowUp':
          if (highlighted > 0) {
            highlighted -= 1;
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (highlighted >= 0) {
            this.addItem(results[highlighted].key);
          }
          break;
        case 'Backspace':
          if (this.state.selected.length > 0 && this.state.searchTerm === '') {
            this.removeItem(this.state.selected[this.state.selected.length - 1].key);
          }
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
   * When clicking outside the component, blur the component
   * and update the original input
   *
   * @param event
   */
  handleClickOutside(event) {
    if (this.wrapperEl && !this.wrapperEl.contains(event.target)) {
      this.setState({
        showSearch: false
      });

      this.updateInputValue();
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }

  /**
   * Update the scroll position of the dropdown when
   * using the arrow keys to scroll
   */
  componentDidUpdate() {
    if (this.wrapperEl) {
      const optionsHolder = this.wrapperEl.querySelector('.p-multiselect__options');
      const selected = this.wrapperEl.querySelector('.p-multiselect__option.is-highlighted');
      if (optionsHolder && selected) {
        const selectedTop = selected.offsetTop;
        const selectedHeight = selected.clientHeight;
        const selectedBottom = selectedTop + selectedHeight;
        const optionsHeight = optionsHolder.clientHeight;
        const optionsScroll = optionsHolder.scrollTop;
        const scrollBottom = optionsHeight + optionsScroll;
        if (selectedBottom > scrollBottom) {
          optionsHolder.scrollTop = optionsScroll + selectedBottom - scrollBottom;
        }
        if (selectedTop < optionsScroll) {
          optionsHolder.scrollTop = selectedTop;
        }
      }
    }
  }

  renderSearch() {
    if (this.state.showSearch) {
      return (
        <ul className="p-multiselect__options">
          {
            this.state.searchResults.map((item, i) => (
              <li
                className={`p-multiselect__option${this.state.highlightedOption === i ? ' is-highlighted' : ''}`}
                data-key={item.key}
                key={item.key}
                onClick={this.clickItem.bind(this, item.key)}
              >
                {item.name}
              </li>
            ))
          }
        </ul>
      );
    }
    return false;
  }

  renderItems() {
    const items = this.state.selected.map(value => (
      <span className="p-multiselect__item" data-key={ value.key } key={ value.key }>
        { value.name }
        <i className="p-icon--close p-multiselect__item-remove" onClick={this.removeItem.bind(this, value.key)}></i>
      </span>
    ));

    return items;
  }

  renderInput() {
    return (
      <input
        type="text"
        className="p-multiselect__input"
        onKeyUp={ this.search }
        ref={input => {this.searchInput = input;}}
      />
    );
  }

  render() {
    return (
      <div
        className={`p-multiselect${this.state.showSearch ? ' is-focused' : ''}`}
        onClick={this.focusInput}
        onKeyDown={this.handleKeypress}
        ref={el => {this.wrapperEl = el;}}
      >
        { this.renderItems() }
        { this.renderInput() }
        { this.renderSearch() }
      </div>
    );
  }
}

MultiSelect.propTypes = {
  input: PropTypes.any,
  values: PropTypes.array
};


/**
 * Initialize the component if used outside of a react app
 *
 * Selector should be in the following format:
 * <div class="selector">
 *   <input type="text" class="js-multiselect-input" name="" value="" />
 *   <div class="js-multiselect-holder"></div>
 * </div>
 *
 * @param {HTMLElement} selector
 * @param {{name: string, key: string}[]} values
 */
function init(selector, values) {
  const el = document.querySelector(selector);

  if (el) {
    const holder = el.querySelector('.js-multiselect-holder');
    const input = el.querySelector('.js-multiselect-input');
    // do the react
    ReactDOM.render(<MultiSelect input={ input } values={ values } />, holder);
  }
}

export { MultiSelect as default, init as initMultiselect };

