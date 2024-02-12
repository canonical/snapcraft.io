import React, { useState, SyntheticEvent, useEffect } from "react";
import Downshift from "downshift";

import debounce from "../../../../libs/debounce";

type License = {
  key: string;
  name: string;
};

type Props = {
  licenses: Array<License>;
  license: string | undefined;
  register: Function;
  setValue: Function;
  setLicense: Function;
  originalLicense: string;
};

function isDirty(newLicense: string, originalLicense: string) {
  return newLicense !== originalLicense;
}

function LicenseSearch({
  licenses,
  license,
  register,
  setValue,
  setLicense,
  originalLicense,
}: Props) {
  const [suggestions, setSuggestions] = useState<License[]>([]);
  const [selectedLicenseKeys, setSelectedLicenseKeys] = useState<string[]>(
    license?.split(" OR ") || []
  );
  const [selectedLicenses, setSelectedLicenses] = useState<
    (License | undefined)[]
  >([]);

  useEffect(() => {
    if (license) {
      setSelectedLicenseKeys(license?.split(" OR "));
    } else {
      setSelectedLicenseKeys([]);
    }
  }, [license]);

  useEffect(() => {
    setSelectedLicenses(
      selectedLicenseKeys
        .filter((key) => licenses.find((l) => l.key === key))
        .map((key) => licenses.find((l) => l.key === key))
    );
  }, [selectedLicenseKeys]);

  return (
    <Downshift
      onChange={(selection) => {
        const newSelectedLicenses = [...selectedLicenses];

        newSelectedLicenses.push(selection);

        const newSelectedLicenseKeys = newSelectedLicenses
          .sort((a: License | undefined, b: License | undefined) => {
            if (a && b) {
              if (a?.name < b?.name) {
                return -1;
              }

              if (a?.name > b?.name) {
                return 1;
              }
            }

            return 0;
          })
          .map((item) => item?.key);

        const newLicense = newSelectedLicenseKeys.join(" OR ");

        setLicense(newLicense);
        setValue("license", newLicense, {
          shouldDirty: isDirty(newLicense, originalLicense),
        });
        setSuggestions([]);
      }}
      itemToString={() => ""}
    >
      {({ getInputProps, getItemProps, getMenuProps, highlightedIndex }) => (
        <div>
          <input
            type="hidden"
            name="license"
            {...register("license", {
              value: license,
            })}
          />
          <div className="p-multiselect u-no-margin--bottom">
            {selectedLicenses.map((selectedLicense) => (
              <span
                className="p-multiselect__item"
                data-key={selectedLicense?.key}
                key={selectedLicense?.key}
              >
                {selectedLicense?.name}
                <i
                  className="p-icon--close p-multiselect__item-remove"
                  onClick={() => {
                    const newSelectedLicenses: (License | undefined)[] =
                      selectedLicenses.filter(
                        (item) => item?.key !== selectedLicense?.key
                      );

                    const newSelectedLicenseKeys: (string | undefined)[] =
                      newSelectedLicenses.map((item) => item?.key);

                    const newLicense = newSelectedLicenseKeys.join(" OR ");
                    setLicense(newLicense);
                    setValue("license", newLicense, {
                      shouldDirty: isDirty(newLicense, originalLicense),
                    });
                  }}
                >
                  Remove license
                </i>
              </span>
            ))}
            <input
              type="text"
              className="p-multiselect__input"
              name="search"
              {...getInputProps({
                onKeyUp: debounce(
                  (
                    e: SyntheticEvent<HTMLInputElement> & {
                      target: HTMLInputElement;
                    }
                  ) => {
                    const value = e?.target?.value.toLowerCase();

                    setSuggestions(
                      licenses.filter((item) => {
                        return (
                          !selectedLicenseKeys.includes(item?.key) &&
                          item?.name.toLowerCase().startsWith(value)
                        );
                      })
                    );
                  },
                  200,
                  false
                ),
                onFocus: () => {
                  setSuggestions(
                    licenses.filter((item) => {
                      return !selectedLicenseKeys.includes(item?.key);
                    })
                  );
                },
                onBlur: () => {
                  setSuggestions([]);
                },
              })}
            />
          </div>
          {suggestions.length ? (
            <ul
              className="p-list p-card--highlighted u-no-padding u-no-margin--bottom p-autocomplete__suggestions"
              {...getMenuProps()}
            >
              {suggestions.map((item: License, index) => (
                <li
                  className="p-list__item p-autocomplete__suggestion"
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
          ) : null}
        </div>
      )}
    </Downshift>
  );
}

export default LicenseSearch;
