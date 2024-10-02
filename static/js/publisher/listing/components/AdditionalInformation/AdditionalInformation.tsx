import {
  UseFormRegister,
  UseFormGetValues,
  UseFormSetValue,
  UseFormWatch,
  FieldValues,
} from "react-hook-form";
import { Row, Col } from "@canonical/react-components";

import LicenseInputs from "./LicenseInputs";

import type { Data } from "../../types";

type Props = {
  data: Data;
  register: UseFormRegister<FieldValues>;
  getValues: UseFormGetValues<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
};

function AdditionalInformation({
  data,
  register,
  getValues,
  setValue,
  watch,
}: Props): JSX.Element {
  return (
    <>
      <h2 className="p-heading--4">Additional information</h2>

      <LicenseInputs
        listingData={data}
        register={register}
        setValue={setValue}
        watch={watch}
      />

      <Row className="p-form__control">
        <Col size={2}>
          <label htmlFor="metrics">Metrics:</label>
        </Col>
        <Col size={8}>
          <p className="u-no-margin--bottom">
            <label className="p-checkbox">
              <input
                type="checkbox"
                className="p-checkbox__input"
                aria-labelledby="public-metrics-checkbox"
                {...register("public_metrics_enabled")}
                defaultChecked={getValues("public_metrics_enabled")}
              />
              <span className="p-checkbox__label" id="public-metrics-checkbox">
                Display public popularity charts
              </span>
            </label>
          </p>
          <div className="p-nested-inputs">
            <p className="u-no-margin--bottom u-no-padding--top">
              <label className="p-checkbox">
                <input
                  type="checkbox"
                  className="p-checkbox__input"
                  aria-labelledby="world-map-checkbox"
                  disabled={!getValues("public_metrics_enabled")}
                  {...register("public_metrics_territories")}
                  defaultChecked={getValues("public_metrics_territories")}
                />
                <span className="p-checkbox__label" id="world-map-checkbox">
                  World map
                </span>
              </label>
              <small className="u-text-muted">
                Displays where your snap is being used by country
              </small>
            </p>
            <p className="u-no-margin--bottom">
              <label className="p-checkbox">
                <input
                  type="checkbox"
                  className="p-checkbox__input"
                  aria-labelledby="linux-distributions-checkbox"
                  disabled={!getValues("public_metrics_enabled")}
                  {...register("public_metrics_distros")}
                  defaultChecked={getValues("public_metrics_distros")}
                />
                <span
                  className="p-checkbox__label"
                  id="linux-distributions-checkbox"
                >
                  Linux distributions
                </span>
              </label>
              <small className="u-text-muted">
                Displays where your snap is being used by distro
              </small>
            </p>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default AdditionalInformation;
