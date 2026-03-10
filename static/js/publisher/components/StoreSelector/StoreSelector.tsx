import Downshift from "downshift";
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

  const getStoreName = (storeId: string | undefined) => {
    if (!storeId) {
      return "Select a store";
    }

    const targetStore = brandStoresList.find((store) => store.id === storeId);
    return targetStore ? targetStore.name : "Select a store";
  };

  return (
    <Downshift
      onChange={(selectedStore) => {
        if (!selectedStore) return;
        if (nativeNavLink) {
          window.location.href = `/admin/${selectedStore.id}/snaps`;
        } else {
          navigate(`/admin/${selectedStore.id}/snaps`);
        }
      }}
      itemToString={() => ""}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        getLabelProps,
        isOpen,
        inputValue,
        toggleMenu,
        reset,
      }) => {
        const { id: inputId, ...inputProps } = getInputProps();

        return (
          <div className="store-selector">
            <button
              className="store-selector__button u-no-margin--bottom"
              onClick={() => toggleMenu()}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
            >
              {id !== undefined ? getStoreName(id) : "Select a store"}
            </button>
            {isOpen && (
              <div className="store-selector__panel">
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
                    onClick={() => reset()}
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
  );
}

export default StoreSelector;
