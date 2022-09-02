import React, { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Form,
  Strip,
  Row,
  Col,
  Notification,
} from "@canonical/react-components";

import PageHeader from "../../../shared/PageHeader";
import SaveAndPreview from "../../../shared/SaveAndPreview";
import SearchAutocomplete from "../../../shared/SearchAutocomplete";

import { getSettingsData, getFormData } from "../../utils";

function App() {
  const settingsData = getSettingsData(window?.settingsData);
  const countries = window?.countries;

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedError, setSavedError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState,
    getValues,
    setValue,
    control,
  } = useForm({
    defaultValues: window?.settingsData,
    mode: "onChange",
  });

  const isDirty = formState.isDirty;
  const isValid = formState.isValid;
  const dirtyFields: { [key: string]: any } = formState.dirtyFields;

  const whitelistCountryKeyValues = useWatch({
    control,
    name: "whitelist_country_keys",
  });

  const blacklistCountryKeyValues = useWatch({
    control,
    name: "blacklist_country_keys",
  });

  const onSubmit = (data: any) => {
    setIsSaving(true);

    fetch(`/${data.snap_name}/settings`, {
      method: "POST",
      body: getFormData(settingsData, dirtyFields, data),
    }).then((response) => {
      if (response.status === 200) {
        setTimeout(() => {
          setIsSaving(false);
          setHasSaved(true);
          reset(data);
          window.scrollTo(0, 0);
        }, 1000);
      } else {
        setTimeout(() => {
          setIsSaving(false);
          setSavedError(true);
        }, 1000);
      }
    });
  };

  useEffect(() => {
    if (whitelistCountryKeyValues) {
      setValue("blacklist_country_keys", "");
    }
  }, [whitelistCountryKeyValues]);

  useEffect(() => {
    if (blacklistCountryKeyValues) {
      setValue("whitelist_country_keys", "");
    }
  }, [blacklistCountryKeyValues]);

  return (
    <>
      <PageHeader snapName={settingsData?.snap_name} activeTab="settings" />

      <Form onSubmit={handleSubmit(onSubmit)} stacked={true}>
        <SaveAndPreview
          snapName={settingsData?.snap_name}
          isDirty={isDirty}
          reset={reset}
          isSaving={isSaving}
          isValid={isValid}
        />

        <Strip shallow={true}>
          {hasSaved && (
            <div className="u-fixed-width">
              <Notification
                severity="positive"
                title="Changes applied successfully."
                onDismiss={() => {
                  setHasSaved(false);
                }}
              />
            </div>
          )}

          {savedError && (
            <div className="u-fixed-width">
              <Notification
                severity="negative"
                title="Something went wrong."
                onDismiss={() => {
                  setHasSaved(false);
                  setSavedError(false);
                }}
              />
            </div>
          )}

          <Row className="p-form__group">
            <Col size={2}>
              <label className="p-form__label" htmlFor="private">
                Visibility:
              </label>
            </Col>
            <Col size={8}>
              <div className="p-form__control">
                <label className="p-radio">
                  <input
                    type="radio"
                    className="p-radio__input"
                    value="public"
                    {...register("visibility")}
                  />
                  <span className="p-radio__label">Public</span>
                  <br />
                  <span className="p-form-help-text">
                    Anyone can find your snap in the Snap Store
                  </span>
                </label>
              </div>

              <div className="p-form__control">
                <label className="p-radio">
                  <input
                    type="radio"
                    className="p-radio__input"
                    value="unlisted"
                    {...register("visibility")}
                  />
                  <span className="p-radio__label">Unlisted</span>
                  <br />
                  <span className="p-form-help-text">
                    Does not appear in search results. Anyone can visit or
                    install using its snap name
                  </span>
                </label>
              </div>

              <div className="p-form__control">
                <label className="p-radio">
                  <input
                    type="radio"
                    className="p-radio__input"
                    value="private"
                    {...register("visibility")}
                  />
                  <span className="p-radio__label">Private</span>
                  <br />
                  <span className="p-form-help-text">
                    Hidden in the Snap Store. Only accessible by the publisher
                    and collaborators
                  </span>
                </label>
              </div>
            </Col>
          </Row>

          <div className="u-fixed-width">
            <hr />
          </div>

          <Row className="p-form__group">
            <Col size={2}>
              <label className="p-form__label" htmlFor="distribution">
                Distribution:
              </label>
            </Col>
            <Col size={8}>
              <p className="u-no-margin--bottom">
                This snap should be available in:
              </p>
              <ul className="p-inline-list">
                <li className="p-inline-list__item">
                  <label
                    className="p-radio u-no-margin--bottom"
                    style={{ display: "inline-block" }}
                  >
                    <input
                      type="radio"
                      className="p-radio__input"
                      value="all"
                      {...register("territory_distribution_status")}
                    />
                    <span className="p-radio__label">All territories</span>
                  </label>
                </li>
                <li className="p-inline-list__item">
                  <label
                    className="p-radio u-no-margin--bottom"
                    style={{ display: "inline-block" }}
                  >
                    <input
                      type="radio"
                      className="p-radio__input"
                      value="custom"
                      {...register("territory_distribution_status")}
                    />
                    <span className="p-radio__label">Selected territories</span>
                  </label>
                </li>
              </ul>

              {getValues("territory_distribution_status") === "custom" && (
                <>
                  <label className="p-radio">
                    <input
                      type="radio"
                      className="p-radio__input"
                      value="include"
                      {...register("country_keys_status")}
                    />
                    <span className="p-radio__label">
                      Only these territories
                    </span>
                  </label>

                  <SearchAutocomplete
                    data={countries}
                    field="whitelist_country_keys"
                    currentValues={settingsData?.whitelist_countries}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    control={control}
                    disabled={getValues("country_keys_status") === "exclude"}
                  />

                  <label className="p-radio">
                    <input
                      type="radio"
                      className="p-radio__input"
                      value="exclude"
                      {...register("country_keys_status")}
                    />
                    <span className="p-radio__label">
                      Exclude these territories
                    </span>
                  </label>

                  <SearchAutocomplete
                    data={countries}
                    field="blacklist_country_keys"
                    currentValues={settingsData?.blacklist_countries}
                    register={register}
                    setValue={setValue}
                    getValues={getValues}
                    control={control}
                    disabled={getValues("country_keys_status") === "include"}
                  />
                </>
              )}
            </Col>
          </Row>

          <div className="u-fixed-width">
            <hr />
          </div>

          <Row className="p-form__group">
            <Col size={2}>
              <label
                className="p-form__label"
                htmlFor="update_metadata_on_release"
              >
                Update metadata on release:
              </label>
            </Col>
            <Col size={8}>
              <div className="p-form__control">
                <label className="p-checkbox">
                  <input
                    type="checkbox"
                    className="p-checkbox__input"
                    {...register("update_metadata_on_release")}
                  />
                  <span className="p-checkbox__label">Enabled</span>
                  <br />
                  <span className="p-form-help-text">
                    The information on the Listing page of this snap will be
                    automatically updated to the version in snapcraft.yaml of
                    the latest revision pushed to the stable channel. If you
                    manually edit the Listing page, the automatic updates will
                    be turned off.{" "}
                    <a href="/docs/snapcraft-top-level-metadata">Learn more</a>.
                  </span>
                </label>

                {getValues("update_metadata_on_release") && (
                  <Notification severity="caution" title="Warning">
                    This snap is set to have its metadata updated when a new
                    revision is published in the stable channel. Any changes you
                    make here will be overwritten by the contents of any snap
                    published. If this is not desirable, please disable “Update
                    metadata on release” for this snap.
                  </Notification>
                )}
              </div>
            </Col>
          </Row>

          <div className="u-fixed-width">
            <hr />
          </div>

          <Row className="p-form__group">
            <Col size={2}>
              <label className="p-form__label" id="collaboration-label">
                Collaboration:
              </label>
            </Col>
            <Col size={8}>
              <div
                className="p-form__control"
                aria-labelledby="collaboration-label"
              >
                <a
                  href={`https://dashboard.snapcraft.io/snaps/${settingsData?.snap_name}/collaboration/`}
                >
                  Manage collaborators in dashboard.snapcraft.io
                </a>
              </div>
            </Col>
          </Row>

          <div className="u-fixed-width">
            <hr />
          </div>

          <Row className="p-form__group">
            <Col size={2}>
              <label className="p-form__label" id="store-label">
                Store:
              </label>
            </Col>
            <Col size={8}>
              <div className="p-form__control" aria-labelledby="store-label">
                {settingsData?.store}
              </div>
            </Col>
          </Row>

          <div className="u-fixed-width">
            <hr />
          </div>

          <Row className="p-form__group">
            <Col size={2}>
              <label className="p-form__label" id="status-label">
                Status:
              </label>
            </Col>
            <Col size={8}>
              <div className="p-form__control" aria-labelledby="status-label">
                {settingsData?.status}
              </div>
            </Col>
          </Row>
        </Strip>
      </Form>
    </>
  );
}

export default App;
