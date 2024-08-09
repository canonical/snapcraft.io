import { useState, useEffect, SyntheticEvent } from "react";
import { nanoid } from "nanoid";
import { Row, Col } from "@canonical/react-components";

type Props = {
  register: Function;
  setValue: Function;
  defaultPublicMetricsBlacklist: Array<string>;
  getValues: Function;
};

function MetricsInputs({
  register,
  setValue,
  getValues,
  defaultPublicMetricsBlacklist,
}: Props) {
  const [publicMetricsBlacklist, setPublicMetricsBlacklist] = useState(
    defaultPublicMetricsBlacklist
  );

  const [publicMetricsDistros, setPublicMetricsDistros] = useState(
    publicMetricsBlacklist.includes(
      "weekly_installed_base_by_operating_system_normalized"
    )
  );

  const displayPublicChartsInputId = nanoid();
  const worldMapInputId = nanoid();
  const linuxDistributionInputId = nanoid();

  const updatePublicMetricsBlacklist = (
    fieldName: string,
    isChecked: boolean
  ) => {
    const newPublicMetricsBlacklist: Array<string> = Array.prototype.concat(
      publicMetricsBlacklist
    );

    if (fieldName === "public_metrics_territories") {
      if (
        !newPublicMetricsBlacklist.includes(
          "installed_base_by_country_percent"
        ) &&
        !isChecked
      ) {
        setPublicMetricsBlacklist(
          newPublicMetricsBlacklist.concat([
            "installed_base_by_country_percent",
          ])
        );
      }

      if (
        newPublicMetricsBlacklist.includes(
          "installed_base_by_country_percent"
        ) &&
        isChecked
      ) {
        setPublicMetricsBlacklist(
          newPublicMetricsBlacklist.filter(
            (d) => d !== "installed_base_by_country_percent"
          )
        );
      }
    }

    if (fieldName === "public_metrics_distros") {
      if (
        !newPublicMetricsBlacklist.includes(
          "weekly_installed_base_by_operating_system_normalized"
        ) &&
        !isChecked
      ) {
        setPublicMetricsBlacklist(
          newPublicMetricsBlacklist.concat([
            "weekly_installed_base_by_operating_system_normalized",
          ])
        );
      }

      if (
        newPublicMetricsBlacklist.includes(
          "weekly_installed_base_by_operating_system_normalized"
        ) &&
        isChecked
      ) {
        setPublicMetricsBlacklist(
          newPublicMetricsBlacklist.filter(
            (d) => d !== "weekly_installed_base_by_operating_system_normalized"
          )
        );
      }
    }
  };

  useEffect(() => {
    setValue("public_metrics_blacklist", publicMetricsBlacklist, {
      shouldDirty: true,
    });
  }, [publicMetricsBlacklist]);

  return (
    <>
      <Row>
        <Col size={2}>
          <p>Metrics:</p>
        </Col>
        <Col size={8}>
          <p className="u-no-margin--bottom">
            <label className="p-checkbox">
              <input
                type="checkbox"
                aria-labelledby={displayPublicChartsInputId}
                className="p-checkbox__input"
                name="public_metrics_enabled"
                {...register("public_metrics_enabled")}
              />
              <span
                className="p-checkbox__label"
                id={displayPublicChartsInputId}
              >
                Display public popularity charts
              </span>
            </label>
          </p>
          <div className="p-nested-inputs">
            <p className="u-no-margin--bottom u-no-padding--top">
              <label className="p-checkbox">
                <input
                  type="checkbox"
                  aria-labelledby={worldMapInputId}
                  className="p-checkbox__input"
                  name="public_metrics_territories"
                  disabled={!getValues("public_metrics_enabled")}
                  {...register("public_metrics_territories", {
                    onChange: (
                      e: SyntheticEvent<HTMLInputElement> & {
                        target: HTMLInputElement;
                      }
                    ) => {
                      updatePublicMetricsBlacklist(
                        e.target.name,
                        e.target.checked
                      );
                    },
                  })}
                />
                <span className="p-checkbox__label" id={worldMapInputId}>
                  World map
                </span>
              </label>
              <small className="u-text-muted">
                Displays where your snap is being used by country
              </small>
            </p>
            <p>
              <label className="p-checkbox">
                <input
                  type="checkbox"
                  aria-labelledby={linuxDistributionInputId}
                  className="p-checkbox__input"
                  name="public_metrics_distros"
                  defaultChecked={!publicMetricsDistros}
                  disabled={!getValues("public_metrics_enabled")}
                  {...register("public_metrics_distros", {
                    onChange: (
                      e: SyntheticEvent<HTMLInputElement> & {
                        target: HTMLInputElement;
                      }
                    ) => {
                      setPublicMetricsDistros(!e.target.checked);
                      updatePublicMetricsBlacklist(
                        e.target.name,
                        e.target.checked
                      );
                    },
                  })}
                />
                <span
                  className="p-checkbox__label"
                  id={linuxDistributionInputId}
                >
                  Linux distributions
                </span>
              </label>
              <small className="u-text-muted">
                Displays where your snap is being used by distro
              </small>
            </p>
          </div>

          <input
            type="hidden"
            name="public_metrics_blacklist"
            value={publicMetricsBlacklist}
            {...register("public_metrics_blacklist")}
          />
        </Col>
      </Row>
    </>
  );
}

export default MetricsInputs;
