import { FC, useEffect, useReducer, useRef } from "react";
import Downshift, { DownshiftState, StateChangeOptions } from "downshift";
import { Icon } from "@canonical/react-components";

export interface ComboBoxItem {
  value: string;
  label: string;
}

export interface ComboBoxProps {
  options: ComboBoxItem[];
  value: ComboBoxItem["value"];
  required?: boolean;
  onChange?: (value: ComboBoxItem["value"] | null) => void;
  onSearch?: (item: ComboBoxItem, inputValue: string) => boolean;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
}

interface ComboBoxState extends DownshiftState<ComboBoxItem> {
  filteredOptions: ComboBoxItem[];
  showAllOptions: boolean;
}

// default filter function, case-insensitive partial match between item.label and inputValue
const defaultFilter: ComboBoxProps["onSearch"] = (
  item: ComboBoxItem,
  inputValue: string,
) => item.label.toLowerCase().includes(inputValue.toLowerCase());

const ComboBox: FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  required,
  label,
  labelClassName,
  placeholder,
  onSearch,
}) => {
  onSearch = onSearch ?? defaultFilter; // if no filter is provided use the default one

  const inputRef = useRef<HTMLInputElement>(null);

  const [comboBoxState, dispatch] = useReducer<
    ComboBoxState,
    Pick<ComboBoxProps, "options" | "value">,
    [StateChangeOptions<ComboBoxItem>]
  >(
    (prevState, action) => {
      const { type, ...changes } = action;

      const nextState = { ...prevState, ...changes };

      // This is an improvement from the UX POV
      // When opening the combobox dropdown to see all the options we have two cases where
      // we should show all options:
      //   1. inputValue is empty; this is trivial
      //   2. we have previously selected an item and we're opening the dropdown without
      //      changing inputValue.
      // In the second case that would mean we already have an inputValue.
      // Normally this would filter out all elements that aren't the selected one, and the
      // user would have to clear the text in the input box before searching and selecting
      // a new element, which is awful from a UX POV...
      // To avoid this, we explicitly check if the user typed anything; as soon as they do the
      // filtering behavior is enabled again. When the dropdown closes we go back to showing
      // all options again
      const inputValueEmpty = !nextState.inputValue;
      const userHasTypedAfterOpening = nextState.isOpen
        ? prevState.showAllOptions && !Object.hasOwn(changes, "inputValue")
        : true;
      nextState.showAllOptions = inputValueEmpty || userHasTypedAfterOpening;

      // filter the options when inputValue changes
      if (Object.hasOwn(changes, "inputValue")) {
        nextState.filteredOptions = options.filter(
          (item) =>
            !nextState.inputValue ||
            nextState.showAllOptions ||
            onSearch(item, nextState.inputValue),
        );
      }

      // Everything below is patching out some of Downshift's behavior that doesn't match the
      // WAI Combobox pattern description
      // for more info, see https://www.w3.org/WAI/ARIA/apg/patterns/combobox/

      if (Object.hasOwn(changes, "isOpen")) {
        // When opening the dropdown with an option already selected, the default highlighted
        // option should be the one that's been selected previously
        const selectedIndex = nextState.filteredOptions.findIndex(
          (item) => item.label === nextState.inputValue,
        );
        nextState.highlightedIndex =
          selectedIndex !== -1 ? selectedIndex : null;

        // Opening the dropdown should always bring focus on the input
        if (changes.isOpen) inputRef.current?.focus();
      }

      // every time inputValue changes, the first option should be highlighted
      if (
        Object.hasOwn(changes, "inputValue") &&
        nextState.filteredOptions.length > 0
      ) {
        nextState.highlightedIndex = 0;
      }

      // fixes for certain keyboard interactions
      switch (type) {
        // Downshift closes the dropdown when pressing the "escape" key, but also resets the
        // selected value to `initialValue`; if Downshift doesn't get a default value prop it
        // resets the value entirely. This implementation falls in the latter case.
        // The correct behavior is:
        //    1. pressing "escape" with the popup open means "close the popup"
        //    2. pressing "escape" with the popup closed means "reset the state"
        // Also, if the combobox is marked as `required` the user shouldn't be able to reset
        // the value, so we reinstate the previous selected value in this case as well.
        case Downshift.stateChangeTypes.keyDownEscape: {
          if (prevState.isOpen || required) {
            nextState.inputValue = prevState.selectedItem?.label ?? "";
            nextState.selectedItem = prevState.selectedItem;
          }
          break;
        }

        // tab-ing after highlighting an option means selecting it; Downshift doesn't do this,
        // instead it just closes the dropdown and resets the previous state
        case Downshift.stateChangeTypes.blurInput: {
          if (prevState.isOpen && prevState.highlightedIndex !== null) {
            nextState.selectedItem =
              prevState.filteredOptions[prevState.highlightedIndex];
            nextState.inputValue = nextState.selectedItem.label;
          }
          break;
        }

        default: {
          break;
        }
      }

      return nextState;
    },
    { options, value },
    // init function finds the selected item based on the options and value props
    ({ options, value }) => {
      const selectedItem = options.find((item) => item.value === value);
      return {
        selectedItem: selectedItem ?? null,
        inputValue: selectedItem?.label ?? "",
        filteredOptions: options,
        isOpen: false,
        highlightedIndex: null,
        showAllOptions: true,
      };
    },
  );

  // part of comboBoxState is based on the props, we must keep the state in sync with them
  useEffect(() => {
    const selectedItem = options.find((item) => item.value === value);

    dispatch({
      type: Downshift.stateChangeTypes.unknown,
      selectedItem: selectedItem ?? null,
      inputValue: selectedItem?.label ?? "",
    });
  }, [value, options]);

  const isOnchangeDisabledRef = useRef(true);

  // Run the onChange callback when we change the selectedItem. We don't pass the callback as a
  // Downshift prop because it wouldn't run when we set the selectedItem inside the state reducer
  useEffect(() => {
    if (isOnchangeDisabledRef.current) return;
    onChange?.(comboBoxState.selectedItem?.value ?? null);
  }, [comboBoxState.selectedItem?.value]);

  // we don't run onChange until after we actually render some real options to choose from, this
  // avoids running it multiple times with an empty selectedItem.value during init (e.g. when
  // fetching the options from an API and we're waiting for the response); it's IMPORTANT that this
  // effect runs after the one that triggers onChange, because we want to make sure not to trigger
  // it on the first render
  useEffect(() => {
    if (isOnchangeDisabledRef.current && options?.length > 0) {
      isOnchangeDisabledRef.current = false;
    }
  }, [options]);

  return (
    <Downshift<ComboBoxItem>
      {...comboBoxState}
      itemToString={(item) => (item ? item.label : "")}
      onStateChange={(changes) => dispatch(changes)}
    >
      {({
        getInputProps,
        getItemProps,
        getLabelProps,
        getMenuProps,
        getToggleButtonProps,
        getRootProps,
        toggleMenu,
      }) => (
        <div className="p-combobox">
          <div>
            <label
              {...getLabelProps()}
              className={`p-combobox__label ${labelClassName ?? ""}`}
            >
              {label ?? "Select"}
            </label>
            <div
              // we created a root element that doesn't match what Downshift normally expects, so
              // we pass this option to suppress an annoying error
              {...getRootProps({}, { suppressRefError: true })}
              className="p-combobox__controls"
            >
              <input
                {...getInputProps({ ref: inputRef })}
                type="search"
                className="p-combobox__input"
                placeholder={placeholder}
                onClick={() => toggleMenu()}
              />
              <button
                {...getToggleButtonProps()}
                className="p-combobox__toggle p-button--base has-icon"
                tabIndex={-1}
              >
                <Icon
                  name={comboBoxState.isOpen ? "chevron-up" : "chevron-down"}
                />
              </button>
            </div>
          </div>
          <ul
            className={`p-combobox__options-panel ${comboBoxState.isOpen ? "active" : ""}`}
            {...getMenuProps()}>
            {comboBoxState.isOpen &&
              comboBoxState.filteredOptions.map((item) => (
                <li
                  {...getItemProps({ item })}
                  key={item.value}
                  className="p-combobox__option">
                  {item.label}
                </li>
              ))}
          </ul>
        </div>
      )}
    </Downshift>
  );
};

export default ComboBox;
