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
  onChange?: (value: ComboBoxItem["value"] | null) => void;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
}

interface ComboBoxState extends DownshiftState<ComboBoxItem> {
  filteredOptions: ComboBoxItem[];
  showAllOptions: boolean;
}

const ComboBox: FC<ComboBoxProps> = ({
  options,
  value,
  onChange,
  label,
  labelClassName,
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [comboBoxState, dispatch] = useReducer<
    ComboBoxState,
    Pick<ComboBoxProps, "options" | "value">,
    [StateChangeOptions<ComboBoxItem>]
  >(
    (prevState, action) => {
      const { type, ...changes } = action;

      console.log(prevState, type, changes);
      const nextState = {
        ...prevState,
        ...changes,
      };

      // Opening the dropdown in any way should focus on the input
      if (changes.isOpen) {
        inputRef.current?.focus();
      }

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

      nextState.filteredOptions = options.filter(
        (item) =>
          !nextState.inputValue ||
          nextState.showAllOptions ||
          item.label.toLowerCase().includes(nextState.inputValue.toLowerCase()),
      );

      // When opening the dropdown with an option being already selected, the default highlighted
      // option should be the that's been selected previously
      if (Object.hasOwn(changes, "isOpen")) {
        const selectedIndex = nextState.filteredOptions.findIndex(
          (item) => item.label === nextState.inputValue,
        );
        nextState.highlightedIndex =
          selectedIndex !== -1 ? selectedIndex : null;
      }

      // pressing the "escape" key should just close the dropdown, not reset its state value
      if (type === Downshift.stateChangeTypes.keyDownEscape) {
        nextState.inputValue = prevState.inputValue;
        nextState.selectedItem = prevState.selectedItem;
      }

      return nextState;
    },
    { options, value },
    ({ options, value }) => {
      const selectedItem = options.find((item) => item.value === value);
      return {
        selectedItem: selectedItem ?? null,
        inputValue: selectedItem?.label ?? "",
        filteredOptions: options.filter(
          (item) =>
            !value || item.label.toLowerCase().includes(value.toLowerCase()),
        ),
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
      onStateChange={(changes, _stateAndHelpers) => {
        console.log(changes);
        dispatch(changes);
      }}
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
