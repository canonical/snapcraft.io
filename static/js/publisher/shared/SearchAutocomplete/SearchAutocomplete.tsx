import React, { useState, useEffect } from "react";
import Downshift from "downshift";
import { useWatch } from "react-hook-form";

type DataItem = {
  key: string;
  name: string;
};

type Props = {
  data: Array<DataItem>;
  field: string;
  currentValues: Array<string>;
  register: Function;
  setValue: Function;
  getValues: Function;
  control: any;
  disabled?: boolean;
};

function SearchAutocomplete({
  data,
  field,
  currentValues,
  register,
  setValue,
  getValues,
  control,
  disabled,
}: Props) {
  const [selections, setSelections] = useState(() => {
    return data.filter((value) => currentValues.includes(value.key));
  });

  const getNewSelectionKeys = (newSelections: Array<DataItem>) => {
    return newSelections
      .map((selection: DataItem) => selection.key)
      .sort()
      .join(" ");
  };

  const shouldDirty = (newSelectionsKeys: string) => {
    return newSelectionsKeys !== getValues(field);
  };

  const selectionKeyValues = useWatch({
    control,
    name: field,
  });

  useEffect(() => {
    setSelections(() => {
      return data.filter((value) => selectionKeyValues.includes(value.key));
    });
  }, [selectionKeyValues]);

  return (
    <Downshift
      onChange={(selection) => {
        const newSelections = selections.concat([selection]);
        const newSelectionsKeys = getNewSelectionKeys(newSelections);

        setSelections(newSelections);
        setValue(field, newSelectionsKeys, {
          shouldDirty: shouldDirty(newSelectionsKeys),
        });
      }}
      itemToString={() => ""}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        isOpen,
        inputValue,
        highlightedIndex,
      }) => (
        <div className="p-multiselect">
          {selections.map((suggestion: DataItem) => (
            <span key={suggestion.key} className="p-multiselect__item">
              {suggestion.name}
              <i
                className="p-icon--close p-multiselect__item-remove"
                onClick={() => {
                  const newSelections = selections.filter(
                    (item: DataItem) => item.key !== suggestion.key
                  );

                  const newSelectionsKeys = getNewSelectionKeys(newSelections);

                  setSelections(newSelections);
                  setValue(field, newSelectionsKeys, {
                    shouldDirty: shouldDirty(newSelectionsKeys),
                  });
                }}
              >
                Remove suggestion
              </i>
            </span>
          ))}

          <input type="hidden" {...register(field)} />

          <input
            type="text"
            className="p-multiselect__input"
            disabled={disabled}
            {...getInputProps()}
          />

          {isOpen && (
            <ul className="p-multiselect__options" {...getMenuProps()}>
              {data
                .filter(
                  (item) =>
                    !inputValue ||
                    item.key.toLowerCase().includes(inputValue) ||
                    item.name.toLowerCase().includes(inputValue)
                )
                .map((item, index) => (
                  <li
                    className="p-multiselect__option"
                    {...getItemProps({
                      key: item.key,
                      index,
                      item,
                      style: {
                        backgroundColor:
                          highlightedIndex === index ? "#f7f7f7" : "#fff",
                      },
                    })}
                  >
                    {item.name}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}
    </Downshift>
  );
}

export default SearchAutocomplete;
