import { useState, KeyboardEvent } from "react";
import Downshift from "downshift";
import { Spinner } from "@canonical/react-components";

import debounce from "../../../libs/debounce";

import type { SnapsList, Snap } from "../../types/shared";

type SetSelectedSnapsFunc = (snaps: SnapsList) => void;

type Props = {
  storeId: string;
  selectedSnaps: SnapsList;
  setSelectedSnaps: SetSelectedSnapsFunc;
  nonEssentialSnapIds: Array<string>;
};

function SnapsSearch({
  storeId,
  selectedSnaps,
  setSelectedSnaps,
  nonEssentialSnapIds,
}: Props): React.JSX.Element {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  return (
    <>
      <Downshift
        onChange={(selection) => {
          setSuggestions([]);

          if (!selectedSnaps.find((item) => item.id === selection.id)) {
            setSelectedSnaps([...selectedSnaps, selection]);
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
        }) => {
          const { id, ...inputProps } = getInputProps({
            onKeyUp: debounce(
              (
                e: KeyboardEvent<HTMLInputElement> & {
                  target: HTMLInputElement;
                },
              ) => {
                if (e.target.value.length < 2) {
                  return;
                }

                setIsSearching(true);

                fetch(
                  `/api/${storeId}/snaps/search?q=${e.target.value}&allowed_for_inclusion=${storeId}`,
                )
                  .then((response) => {
                    if (response.status !== 200) {
                      throw Error(response.statusText);
                    }

                    return response.json();
                  })
                  .then((data) => {
                    const selectionIds = selectedSnaps.map((item) => item.id);

                    setSuggestions(
                      data.filter((item: Snap) => {
                        return (
                          !selectionIds.includes(item.id) &&
                          !nonEssentialSnapIds.includes(item.id)
                        );
                      }),
                    );

                    setIsSearching(false);
                  })
                  .catch((error) => {
                    setIsSearching(false);
                    console.error(error);
                  });
              },
              200,
              false,
            ),
          });

          return (
            <div className="p-autocomplete">
              <label className="u-off-screen" htmlFor={id} {...getLabelProps()}>
                Search for available snaps
              </label>
              <div className="p-search-box u-no-margin--bottom">
                <input
                  type="search"
                  id={id}
                  className="p-search-box__input"
                  name="search"
                  placeholder="Search available snaps"
                  {...inputProps}
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
                  {suggestions.map((item: Snap, index: number) => (
                    <li
                      className="p-list__item"
                      key={item.id}
                      {...getItemProps({
                        index,
                        item,
                        style: {
                          backgroundColor:
                            highlightedIndex === index ? "#f7f7f7" : "#fff",
                          paddingLeft: "1rem",
                          paddingRight: "1rem",
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
          );
        }}
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
                        (suggestion) => suggestion.id !== item.id,
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

export default SnapsSearch;
