import { useState, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useParams, NavLink } from "react-router-dom";

import { brandStoresState } from "../../state/brandStoreState";

import type { Store } from "../../types/shared";

type Props = {
  nativeNavLink?: boolean;
};

function StoreSelector({ nativeNavLink }: Props): React.JSX.Element {
  const { id } = useParams();
  const brandStoresList = useAtomValue(brandStoresState);
  const [showStoreSelector, setShowStoreSelector] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState("");
  const [filteredBrandStores, setFilteredBrandstores] =
    useState<Store[]>(brandStoresList);

  const getStoreName = (id: string | undefined) => {
    if (!id) {
      return;
    }

    const targetStore = brandStoresList.find((store) => store.id === id);

    if (targetStore) {
      return targetStore.name;
    }

    return;
  };

  useEffect(() => {
    setFilteredBrandstores(brandStoresList);
  }, [brandStoresList]);

  return (
    <div className="store-selector">
      <button
        className="store-selector__button u-no-margin--bottom"
        onClick={() => {
          setShowStoreSelector(!showStoreSelector);
        }}
      >
        {id !== undefined ? getStoreName(id) : "Select a store"}
      </button>
      {showStoreSelector && (
        <div className="store-selector__panel">
          <div className="p-search-box u-no-margin--bottom">
            <label htmlFor="search-stores" className="u-off-screen">
              Search stores
            </label>
            <input
              type="search"
              className="p-search-box__input"
              id="search-stores"
              name="search-stores"
              placeholder="Search"
              value={searchValue}
              onInput={(e) => {
                const value = (e.target as HTMLInputElement).value;
                setSearchValue(value);
                if (value.length > 0) {
                  setFilteredBrandstores(
                    brandStoresList.filter((store) => {
                      const storeName = store.name.toLowerCase();
                      return storeName.includes(value.toLowerCase());
                    }),
                  );
                } else {
                  setFilteredBrandstores(brandStoresList);
                }
              }}
            />
            <button
              type="reset"
              className="p-search-box__reset"
              onClick={() => {
                setSearchValue("");
                setFilteredBrandstores(brandStoresList);
              }}
            >
              <i className="p-icon--close">Close</i>
            </button>
            <button type="submit" className="p-search-box__button">
              <i className="p-icon--search">Search</i>
            </button>
          </div>
          <ul className="store-selector__list" style={{ listStyle: "none" }}>
            {filteredBrandStores.map((store: Store) => (
              <li key={store.id} className="store-selector__item">
                {nativeNavLink ? (
                  <a href={`/admin/${store.id}/snaps`}>{store.name}</a>
                ) : (
                  <NavLink
                    to={`/admin/${store.id}/snaps`}
                    onClick={() => {
                      setShowStoreSelector(false);
                    }}
                  >
                    {store.name}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default StoreSelector;
