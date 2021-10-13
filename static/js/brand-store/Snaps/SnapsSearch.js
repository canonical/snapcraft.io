import React, { useState } from "react";
import PropTypes from "prop-types";
import Downshift from "downshift";
import { Spinner } from "@canonical/react-components";

import debounce from "../../libs/debounce";

function SnapsSearch({
  storeId,
  selectedSnaps,
  setSelectedSnaps,
  nonEssentialSnapIds,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <>
      <Downshift
        onChange={(selection) => {
          setSuggestions([]);

          if (!selectedSnaps.find((item) => item.id === selection.id)) {
            setSelectedSnaps([].concat(selectedSnaps, [selection]));
          }
        }}
        itemToString={() => ""}
      >
        {({
          getInputProps,
          getItemProps,
          getLabelProps,
          getMenuProps,
          isOpen,
          highlightedIndex,
        }) => (
          <div className="p-autocomplete">
            <label className="u-off-screen" {...getLabelProps()}>
              Search for available snaps
            </label>
            <div className="p-search-box u-no-margin--bottom">
              <input
                type="search"
                className="p-search-box__input"
                name="search"
                placeholder="Search available snaps"
                autoComplete="off"
                {...getInputProps({
                  onKeyUp: debounce((e) => {
                    if (e.target.value.length < 2) {
                      return;
                    }

                    setIsSearching(true);

                    fetch(
                      `/admin/${storeId}/snaps/search?q=${e.target.value}&allowed_for_inclusion=${storeId}`
                    )
                      .then((response) => {
                        if (response.status !== 200) {
                          throw Error(response.statusText);
                        }

                        return response.json();
                      })
                      .then((data) => {
                        const selectionIds = selectedSnaps.map(
                          (item) => item.id
                        );

                        setSuggestions(
                          data.filter((item) => {
                            return (
                              !selectionIds.includes(item.id) &&
                              !nonEssentialSnapIds.includes(item.id)
                            );
                          })
                        );

                        setIsSearching(false);
                      })
                      .catch((error) => {
                        setIsSearching(false);
                        console.error(error);
                      });
                  }, 200),
                })}
              />
              {isSearching && <Spinner text="" />}
              <button
                type="reset"
                className={`p-search-box__reset ${!isOpen ? "u-hide" : ""}`}
              >
                <i className="p-icon--close"></i>
              </button>

              <button
                type="submit"
                className={`p-search-box__button ${isOpen ? "u-hide" : ""}`}
              >
                <i className="p-icon--search"></i>
              </button>
            </div>
            {isOpen && suggestions.length ? (
              <ul
                className="p-list p-card--highlighted u-no-padding u-no-margin--bottom p-autocomplete__suggestions"
                {...getMenuProps()}
              >
                {suggestions.map((item, index) => (
                  <li
                    className="p-list__item"
                    key={item.id}
                    {...getItemProps({
                      key: item.id,
                      index,
                      item,
                      style: {
                        backgroundColor:
                          highlightedIndex === index ? "#f7f7f7" : "#fff",
                      },
                    })}
                  >
                    <div className="u-truncate">{item.name}</div>
                    <div>
                      <small className="u-text-muted">
                        {item.users[0].displayname} | {item.store}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
      </Downshift>
      <ul className="p-list p-autocomplete__result-list">
        {selectedSnaps.length
          ? selectedSnaps.map((item) => (
              <li
                className="p-autocomplete__result p-list__item p-card"
                key={item.id}
              >
                <div>
                  <div>{item.name}</div>
                  <div>
                    <small className="u-text-muted">
                      {item.users[0].displayname} | {item.store}
                    </small>
                  </div>
                </div>
                <button
                  className="p-button--link"
                  onClick={() => {
                    setSelectedSnaps([
                      ...selectedSnaps.filter(
                        (suggestion) => suggestion.id !== item.id
                      ),
                    ]);
                  }}
                >
                  <i className="p-icon--delete"></i>
                </button>
              </li>
            ))
          : null}
      </ul>
    </>
  );
}

SnapsSearch.propTypes = {
  storeId: PropTypes.string.isRequired,
  selectedSnaps: PropTypes.array.isRequired,
  setSelectedSnaps: PropTypes.func.isRequired,
  nonEssentialSnapIds: PropTypes.array.isRequired,
};

export default SnapsSearch;
