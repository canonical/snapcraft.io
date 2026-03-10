import { useState, useEffect } from "react";
import { useCombobox } from "downshift";
import { useAtomValue } from "jotai";
import { useParams, useNavigate } from "react-router-dom";

import { brandStoresState } from "../../state/brandStoreState";

import type { Store } from "../../types/shared";

type Props = {
  nativeNavLink?: boolean;
};

function StoreSelector({ nativeNavLink }: Props): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const brandStoresList = useAtomValue(brandStoresState);
  const [filteredStores, setFilteredStores] =
    useState<Store[]>(brandStoresList);

  useEffect(() => {
    setFilteredStores(brandStoresList);
  }, [brandStoresList]);

  const getStoreName = (storeId: string | undefined) => {
    if (!storeId) {
      return "Select a store";
    }

    const targetStore = brandStoresList.find((store) => store.id === storeId);
    return targetStore ? targetStore.name : "Select a store";
  };

  const {
    isOpen,
    getLabelProps,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getItemProps,
    reset,
  } = useCombobox<Store>({
    items: filteredStores,
    itemToString: (item) => (item ? item.name : ""),
    onInputValueChange: ({ inputValue = "" }) => {
      setFilteredStores(
        brandStoresList.filter((store) =>
          store.name.toLowerCase().includes(inputValue.toLowerCase()),
        ),
      );
    },
    onIsOpenChange: ({ isOpen }) => {
      if (!isOpen) {
        setFilteredStores(brandStoresList);
      }
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (!selectedItem) return;
      if (nativeNavLink) {
        window.location.href = `/admin/${selectedItem.id}/snaps`;
      } else {
        navigate(`/admin/${selectedItem.id}/snaps`);
      }
    },
    stateReducer: (_state, actionAndChanges) => {
      const { type, changes } = actionAndChanges;
      switch (type) {
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: "" };
        default:
          return changes;
      }
    },
  });

  const { id: inputId, ...inputProps } = getInputProps();

  return (
    <div className="store-selector">
      <button
        className="store-selector__button u-no-margin--bottom"
        {...getToggleButtonProps()}
      >
        {id !== undefined ? getStoreName(id) : "Select a store"}
      </button>
      <div
        className="store-selector__panel"
        style={{ display: isOpen ? "block" : "none" }}
      >
        <div className="p-search-box u-no-margin--bottom">
          <label
            htmlFor={inputId}
            className="u-off-screen"
            {...getLabelProps()}
          >
            Search stores
          </label>
          <input
            type="search"
            id={inputId}
            className="p-search-box__input"
            name="search-stores"
            placeholder="Search"
            {...inputProps}
          />
          <button
            type="reset"
            className="p-search-box__reset"
            onClick={() => {
              reset();
            }}
          >
            <i className="p-icon--close">Close</i>
          </button>
          <button type="submit" className="p-search-box__button">
            <i className="p-icon--search">Search</i>
          </button>
        </div>
        <ul
          className="store-selector__list"
          style={{ listStyle: "none" }}
          {...getMenuProps()}
        >
          {isOpen &&
            filteredStores.map((store: Store, index: number) => (
              <li
                key={store.id}
                className="store-selector__item"
                {...getItemProps({ item: store, index })}
              >
                {store.name}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default StoreSelector;
