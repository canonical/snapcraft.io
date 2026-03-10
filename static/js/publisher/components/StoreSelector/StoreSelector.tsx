import { useMemo } from "react";
import Downshift from "downshift";
import { useAtomValue } from "jotai";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@canonical/react-components";

import { brandStoresState } from "../../state/brandStoreState";

import type { Store } from "../../types/shared";

type Props = {
  nativeNavLink?: boolean;
};

function StoreSelectorPlaceholder(): React.JSX.Element {
  return (
    <div className="store-selector">
      <label className="u-off-screen" htmlFor="store-selector-placeholder">
        Search stores
      </label>
      <input
        id="store-selector-placeholder"
        type="search"
        readOnly
        className="store-selector__input u-no-margin--bottom"
        name="search-stores"
        placeholder="Select a store"
      />
      <button className="store-selector__button p-button--base has-icon u-no-margin">
        <Icon name="chevron-down" />
      </button>
    </div>
  );
}

function StoreSelector({ nativeNavLink }: Props): React.JSX.Element {
  const { id } = useParams();
  const navigate = useNavigate();
  const brandStoresList = useAtomValue(brandStoresState);

  const activeStore = useMemo(
    () => brandStoresList.find((store) => store.id === id),
    [brandStoresList, id],
  );
  const activeStoreName = activeStore?.name ?? "";

  return brandStoresList.length > 0 ? (
    <Downshift<Store>
      onChange={(selectedStore) => {
        if (!selectedStore) return;
        if (nativeNavLink) {
          window.location.href = `/admin/${selectedStore.id}/snaps`;
        } else {
          navigate(`/admin/${selectedStore.id}/snaps`);
        }
      }}
      initialSelectedItem={activeStore}
      onUserAction={(a, { isOpen, setState }) => {
        const { clickButton, unknown } = Downshift.stateChangeTypes;

        switch (a.type) {
          case clickButton:
            setState({
              inputValue: isOpen ? "" : activeStoreName,
            });
            break;
          case unknown:
            // Downshift doesn't track click events on the input, this is an ugly workaround
            if (Object.hasOwn(a, "isOpen")) {
              setState({
                inputValue: a.isOpen ? "" : activeStoreName,
              });
            }
            break;
          default:
            break;
        }
      }}
      itemToString={(selectedStore) => selectedStore?.name ?? ""}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        getLabelProps,
        getToggleButtonProps,
        isOpen,
        inputValue,
        toggleMenu,
      }) => {
        return (
          <div className="store-selector">
            {/* label is provided by getLabelProps */}
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="u-off-screen" {...getLabelProps()}>
              Search stores
            </label>
            <input
              type="search"
              className="store-selector__input u-no-margin--bottom"
              name="search-stores"
              placeholder="Select a store"
              {...getInputProps()}
              onClick={() => toggleMenu()}
            />
            <button
              className="store-selector__button p-button--base has-icon u-no-margin"
              {...getToggleButtonProps()}
            >
              <Icon name={isOpen ? "chevron-up" : "chevron-down"} />
            </button>
            {isOpen && (
              <div className="store-selector__panel">
                <ul
                  className="store-selector__list"
                  style={{ listStyle: "none" }}
                  {...getMenuProps()}
                >
                  {brandStoresList
                    .filter(
                      (store) =>
                        !inputValue ||
                        store.name
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()),
                    )
                    .map((store: Store) => (
                      <li
                        key={store.id}
                        className="store-selector__item"
                        {...getItemProps({ item: store })}
                      >
                        {store.name}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        );
      }}
    </Downshift>
  ) : (
    <StoreSelectorPlaceholder />
  );
}

export default StoreSelector;
