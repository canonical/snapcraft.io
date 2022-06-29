import React, { useState, SyntheticEvent } from "react";
import Downshift from "downshift";

import debounce from "../../../../libs/debounce";

type License = {
  key: string;
  name: string;
};

type Props = {
  licenses: Array<License>;
  license: string;
  register: Function;
  setValue: Function;
};

function getLicense(key: string | undefined, licenses: Array<License>) {
  return licenses.find((license) => license?.key === key);
}

function LicenseSearch({ licenses, license, register, setValue }: Props) {
  const [suggestions, setSuggestions] = useState<License[]>([]);
  const [selectedLicenseKeys, setSelectedLicenseKeys] = useState<
    (string | undefined)[]
  >(license.split(" OR ") || []);
  const [selectedLicenses, setSelectedLicenses] = useState(
    selectedLicenseKeys.map((item) => getLicense(item, licenses))
  );

  return (
    <Downshift
      onChange={(selection) => {
        const newSelectedLicenses = [...selectedLicenses];

        newSelectedLicenses.push(selection);

        setSelectedLicenses(newSelectedLicenses);
        setSelectedLicenseKeys(newSelectedLicenses.map((item) => item?.key));
        setValue("license", selectedLicenseKeys.join(" OR "));
        setSuggestions([]);
      }}
      itemToString={() => ""}
    >
      {({
        getInputProps,
        getItemProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
      }) => (
        <div>
          <input
            type="hidden"
            name="license"
            value={license}
            {...register("license")}
          />
          <div className="p-multiselect">
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
                    const newSelectedLicenses: (
                      | License
                      | undefined
                    )[] = selectedLicenses.filter(
                      (item) => item?.key !== selectedLicense?.key
                    );

                    setSelectedLicenses(newSelectedLicenses);
                    setSelectedLicenseKeys(
                      newSelectedLicenses.map((item) => item?.key)
                    );

                    setValue("license", selectedLicenseKeys.join(" OR "));
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
              autoComplete="off"
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
              })}
            />
          </div>
          {isOpen && suggestions.length ? (
            <ul
              className="p-list p-card--highlighted u-no-padding u-no-margin--bottom p-autocomplete__suggestions"
              {...getMenuProps()}
            >
              {suggestions.map((item: License, index) => (
                <li
                  className="p-list__item"
                  key={item.key}
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
