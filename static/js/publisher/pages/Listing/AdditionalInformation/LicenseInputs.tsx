import { useState, useEffect, SetStateAction } from "react";
import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldValues,
} from "react-hook-form";
import { nanoid } from "nanoid";
import { Row, Col } from "@canonical/react-components";

import LicenseSearch from "./LicenseSearch";

type Props = {
  listingData: {
    license: string;
    license_type: string;
    licenses: Array<{ key: string; name: string }>;
  };
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
};

function LicenseInputs({ listingData, register, setValue, watch }: Props) {
  const [licenseType, setLicenseType] = useState(listingData?.license_type);
  const [license, setLicense] = useState(listingData?.license);

  const simpleLicenseId = nanoid();
  const customLicenseId = nanoid();

  useEffect(() => {
    const subscription = watch(
      (value: { [index: string]: SetStateAction<string> }) => {
        setLicense(value?.license);
      },
    );
    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <>
      <Row>
        <Col size={2}>
          <p>License:</p>
        </Col>
        <Col size={8} style={{ minHeight: "160px" }}>
          <ul className="p-inline-list u-no-margin--bottom">
            <li className="p-inline-list__item">
              <label className="p-radio" style={{ display: "inline-block" }}>
                <input
                  type="radio"
                  className="p-radio__input"
                  name="license-type"
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
                  name="license-type"
                  aria-labelledby={customLicenseId}
                  value="custom"
                  checked={licenseType === "custom"}
                  onChange={() => {
                    setLicenseType("custom");
                    setValue("license", license);
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
              <div className="p-autocomplete">
                <LicenseSearch
                  licenses={listingData?.licenses}
                  license={license}
                  register={register}
                  setValue={setValue}
                  setLicense={setLicense}
                  originalLicense={listingData?.license}
                />
                <p className="p-form-help-text" style={{ marginTop: "1rem" }}>
                  The license(s) under which you will release your snap.
                  Multiple licenses can be selected to indicate alternative
                  choices.
                </p>
              </div>
            </>
          )}

          {licenseType === "custom" && (
            <>
              <textarea {...register("license")} />

              <small className="u-text-muted">
                Visit{" "}
                <a href="https://spdx.github.io/spdx-spec/v2.3/">
                  SPDX Specification 2.3
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
