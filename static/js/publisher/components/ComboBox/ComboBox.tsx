import { FC, useEffect, useReducer, useRef } from "react";
import Downshift, { DownshiftState, StateChangeOptions } from "downshift";
import { Icon } from "@canonical/react-components";

export interface ComboBoxItem {
  value: string;
  label: string;
}

export interface ComboBoxProps {
  name: string;
  options: ComboBoxItem[];
  value: ComboBoxItem["value"];
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
  label,
  labelClassName,
  placeholder,
  onSearch: onSearch,
}) => {
  onSearch = onSearch ?? defaultFilter; // if no filter is provided use a default

  const inputRef = useRef<HTMLInputElement>(null);

  const [comboBoxState, dispatch] = useReducer<
    ComboBoxState,
    Pick<ComboBoxProps, "options" | "value">,
    [StateChangeOptions<ComboBoxItem>]
  >(
    (prevState, action) => {
      const { type, ...changes } = action;

      // console.log(type, prevState, changes);

      const nextState = { ...prevState, ...changes };

      // This is an improvement from the UX POV
      // When opening the combobox dropdown to see all the options we have two cases where
      // we should show all options:
      //   1. inputValue is empty; this is trivial
      //   2. we have previously selected an item and we're opening the dropdown without
      // changing inputValue.
      // Opening the combobox after selecting an option, means we already have an inputValue.
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

      // focus should move to the first value that matches the filter when results change
      if (Object.hasOwn(changes, "inputValue")) {
        nextState.highlightedIndex = 0;
      }

      // Opening the dropdown should always bring focus on the input
      if (changes.isOpen) inputRef.current?.focus();

      // When opening the dropdown with an option already selected, the default highlighted
      // option should be the one that's been selected previously
      if (Object.hasOwn(changes, "isOpen")) {
        const selectedIndex = nextState.filteredOptions.findIndex(
          (item) => item.label === nextState.inputValue,
        );
        nextState.highlightedIndex =
          selectedIndex !== -1 ? selectedIndex : null;
      }

      // fixes for certain keyboard interactions
      switch (type) {
        // Downshift implements arrow keys navigation, but it cycles the options in the list
        // when it reaches the extremes; the WAI spec prescribes that this shouldn't happen;
        // if the user presses "up" on the first option or "down" on the last one, we should
        // ignore the change Downshift proposes
        case Downshift.stateChangeTypes.keyDownArrowUp: {
          if (prevState.highlightedIndex === 0) {
            nextState.highlightedIndex = 0;
          } else if (prevState.highlightedIndex === null) {
            // when opening the dropdown without a selected value, Downshift makes the first
            // "up" press move navigation to the bottom; this is wrong
            nextState.highlightedIndex = null;
          }

          break;
        }
        case Downshift.stateChangeTypes.keyDownArrowDown: {
          const lastIndex = prevState.filteredOptions.length - 1;
          if (prevState.highlightedIndex === lastIndex) {
            nextState.highlightedIndex = lastIndex;
          }
          break;
        }

        // Downshift closes the dropdown when pressing the "escape" key, but also resets the
        // selected value to the default one; the latter shouldn't happen, we restore the last
        // selected value (if available) instead
        case Downshift.stateChangeTypes.keyDownEscape: {
          nextState.inputValue = prevState.selectedItem?.label ?? "";
          nextState.selectedItem = prevState.selectedItem;
          break;
        }

        // blurring the input, via keyboard, with an option highlighted means selecting it;
        // Downshift doesn't do this, it behaves as if we pressed "escape" instead
        case Downshift.stateChangeTypes.blurInput: {
          if (prevState.highlightedIndex !== null) {
            // restore the previous state, select the item and dispatch onChange
            nextState.filteredOptions = prevState.filteredOptions;
            nextState.highlightedIndex = prevState.highlightedIndex;
            nextState.selectedItem =
              prevState.filteredOptions[prevState.highlightedIndex!];
            nextState.inputValue = nextState.selectedItem.label;

            // we have to dispatch onChange manually; since we don't have control over it and
            // don't know what it does, we run it in a setTimeout callback so it doesn't trigger
            // a rerender loop
            if (onChange) {
              setTimeout(() => {
                onChange?.(nextState.selectedItem!.value);
              }, 0);
            }
          }
          break;
        }

        default: {
          break;
        }
      }

      // console.log(nextState);
      return nextState;
    },
    { options, value },
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
    // reset the selectedItem when props.value is reset
    if (!value && comboBoxState.selectedItem !== null) {
      dispatch({
        type: Downshift.stateChangeTypes.unknown,
        selectedItem: null,
        inputValue: "",
      });
    }

    // update the inputValue and selectedItem when props.value or props.items change
    if (
      value &&
      options.length > 0 &&
      value !== comboBoxState.selectedItem?.value
    ) {
      const selectedItem = options.find((item) => item.value === value);

      dispatch({
        type: Downshift.stateChangeTypes.unknown,
        selectedItem: selectedItem ?? null,
        inputValue: selectedItem?.label ?? "",
      });
    }
  }, [value, options]);

  return (
    <Downshift<ComboBoxItem>
      {...comboBoxState}
      onChange={(item) => onChange?.(item?.value ?? null)}
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
        <div className="p-combobox" style={{ position: "relative" }}>
          <div>
            <label
              {...getLabelProps()}
              className={`p-combobox__label ${labelClassName}`}
            >
              {label ?? "Select"}
            </label>
            <div
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
                className="p-combobox__toggle p-button--base has-icon u-no-margin"
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
            {...getMenuProps()}
          >
            {comboBoxState.isOpen &&
              comboBoxState.filteredOptions.map((item) => (
                <li
                  {...getItemProps({ item })}
                  key={item.value}
                  className="p-combobox__option"
                >
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
