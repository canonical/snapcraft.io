import React, { useState, SyntheticEvent } from "react";
import { nanoid } from "nanoid";
import { Row, Col } from "@canonical/react-components";

import LicenseSearch from "./LicenseSearch";

type Props = {
  listingData: {
    license: string;
    license_type: string;
    licenses: Array<{ key: string; name: string }>;
  };
  register: Function;
  setValue: Function;
};

function LicenseInputs({ listingData, register, setValue }: Props) {
  const [license, setLicense] = useState(listingData?.license);
  const [licenseType, setLicenseType] = useState(listingData?.license_type);

  const simpleLicenseId = nanoid();
  const customLicenseId = nanoid();

  return (
    <>
      <Row>
        <Col size={2}>
          <p>License:</p>
        </Col>
        <Col size={8} style={{ minHeight: "154px" }}>
          <ul className="p-inline-list u-no-margin--bottom">
            <li className="p-inline-list__item">
              <label className="p-radio" style={{ display: "inline-block" }}>
                <input
                  type="radio"
                  className="p-radio__input"
                  name="license-simple"
                  aria-labelledby={simpleLicenseId}
                  value="simple"
                  checked={licenseType === "simple"}
                  onChange={() => {
                    setLicenseType("simple");
                  }}
                />
                <span className="p-radio__label" id={simpleLicenseId}>
                  Simple
                </span>
              </label>
            </li>

            <li className="p-inline-list__item">
              <label className="p-radio" style={{ display: "inline-block" }}>
                <input
                  type="radio"
                  className="p-radio__input"
                  name="license-custom"
                  aria-labelledby={customLicenseId}
                  value="custom"
                  checked={licenseType === "custom"}
                  onChange={() => {
                    setLicenseType("custom");
                  }}
                />
                <span className="p-radio__label" id={customLicenseId}>
                  Custom SPDX expression
                </span>
              </label>
            </li>
          </ul>

          {licenseType === "simple" && (
            <>
              <LicenseSearch
                licenses={listingData?.licenses}
                license={listingData?.license}
                register={register}
                setValue={setValue}
              />
              <small className="u-text-muted">
                The license(s) under which you will release your snap. Multiple
                licenses can be selected to indicate alternative choices.
              </small>
            </>
          )}

          {licenseType === "custom" && (
            <>
              <textarea
                name="license"
                defaultValue={license}
                onInput={(
                  e: SyntheticEvent<HTMLInputElement> & {
                    target: HTMLInputElement;
                  }
                ) => {
                  setLicense(e.target.value);
                }}
                {...register("license")}
              />

              <small className="u-text-muted">
                Visit{" "}
                <a href="https://spdx.org/spdx-specification-21-web-version#h.jxpfx0ykyb60">
                  SPDX Specification 21
                </a>{" "}
                for more information.
              </small>
            </>
          )}
        </Col>
      </Row>
    </>
  );
}

export default LicenseInputs;
