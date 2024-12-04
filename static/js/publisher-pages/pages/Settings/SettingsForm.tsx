import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Button,
  Form,
  Strip,
  Row,
  Col,
  Notification,
  Tooltip,
} from "@canonical/react-components";

import SaveAndPreview from "../../components/SaveAndPreview";
import SearchAutocomplete from "../../components/SearchAutocomplete";
import UpdateMetadataModal from "../../components/UpdateMetadataModal";
import SaveStateNotifications from "../../components/SaveStateNotifications";
import { UnregisterSnapModal } from "./UnregisterSnapModal";

import { getSettingsData, getSettingsFormData } from "../../utils";

import type { SettingsData } from "../../types";

type Props = {
  settings: SettingsData;
};

function SettingsForm({ settings }: Props) {
  const settingsData = getSettingsData(settings);
  const countries = settingsData.countries;

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [savedError, setSavedError] = useState<
    boolean | { code: string; message: string }[]
  >(false);
  const [unregisterError, setUnregisterError] = useState(false);
  const [unregisterErrorMessage, setUnregisterErrorMessage] = useState("");
  const [unregisterModalOpen, setUnregisterModalOpen] = useState(false);
  const [isUsersSnap, setIsUsersSnap] = useState(false);
  const [formData, setFormData] = useState({});
  const [showMetadataWarningModal, setShowMetadataWarningModal] =
    useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState,
    getValues,
    setValue,
    control,
  } = useForm({
    defaultValues: settingsData,
    mode: "onChange",
  });

  const isDirty = formState.isDirty;
  const isValid = formState.isValid;
  const dirtyFields: { [key: string]: unknown } = formState.dirtyFields;

  const whitelistCountryKeyValues = useWatch({
    control,
    name: "whitelist_country_keys",
  });

  const blacklistCountryKeyValues = useWatch({
    control,
    name: "blacklist_country_keys",
  });

  const onSubmit = (data: SettingsData) => {
    if (getValues("update_metadata_on_release") && dirtyFields.visibility) {
      setShowMetadataWarningModal(true);
      setFormData(data);
    } else {
      submitForm(data);
    }
  };

  const submitForm = async (data: SettingsData) => {
    setIsSaving(true);
    setHasSaved(false);
    setSavedError(false);

    if (data.visibility === "private" || data.visibility_locked) {
      data.private = true;
      data.unlisted = false;
    } else if (data.visibility === "unlisted") {
      data.private = false;
      data.unlisted = true;
    } else if (data.visibility === "public") {
      data.private = false;
      data.unlisted = false;
    }

    const response = await fetch(`/api/${data.snap_name}/settings`, {
      method: "POST",
      body: getSettingsFormData(settingsData, dirtyFields, data),
    });

    if (response.status !== 200) {
      setIsSaving(false);
      setSavedError(true);
      return;
    }

    let newData = await response.json();

    setIsSaving(false);

    if (newData.error_list) {
      setSavedError(newData.error_list);
      setIsSaving(false);
      return;
    }

    setHasSaved(true);
    setIsSaving(false);

    newData = { ...data, ...newData };

    if (newData.private) {
      newData.visibility = "private";
    } else if (newData.unlisted) {
      newData.visibility = "unlisted";
    }

    reset(newData);
    window.scrollTo(0, 0);
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

  useEffect(() => {
    const snapName = settingsData?.snap_name;

    fetch(`/snap_info/user_snap/${snapName}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}}`);
        }
        return response.json();
      })
      .then((data) => {
        setIsUsersSnap(data.is_users_snap);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [settingsData?.snap_name]);

  return (
    <>
      {settingsData?.visibility_locked && (
        <div className="u-fixed-width">
          <Notification severity="information" title="">
            Your Snap is in the queue for manual review. When approved, you will
            receive an email, and you will be able to change the visibility of
            your Snap.
          </Notification>
        </div>
      )}
      <Form onSubmit={handleSubmit(onSubmit)} stacked={true}>
        <SaveAndPreview
          snapName={settingsData?.snap_name}
          isDirty={isDirty}
          reset={reset}
          isSaving={isSaving}
          isValid={isValid}
        />

        <Strip shallow={true}>
          <SaveStateNotifications
            hasSaved={hasSaved}
            setHasSaved={setHasSaved}
            savedError={savedError}
            setSavedError={setSavedError}
          />

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
                    disabled={settingsData?.visibility_locked}
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
                    disabled={settingsData?.visibility_locked}
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
                    disabled={settingsData?.visibility_locked}
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
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    register={register}
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    setValue={setValue}
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    getValues={getValues}
                    // @ts-expect-error Conflict between React Query and React Hook Form
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
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    register={register}
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    setValue={setValue}
                    // @ts-expect-error Conflict between React Query and React Hook Form
                    getValues={getValues}
                    // @ts-expect-error Conflict between React Query and React Hook Form
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
                    {...register("update_metadata_on_release", {
                      setValueAs: (value) => value === "on" || value === true,
                    })}
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
            {unregisterModalOpen && (
              <UnregisterSnapModal
                snapName={settingsData.snap_name}
                setUnregisterModalOpen={setUnregisterModalOpen}
                setUnregisterError={setUnregisterError}
                setUnregisterErrorMessage={setUnregisterErrorMessage}
              />
            )}
            <Col size={2}>
              <label className="p-form__label" id="status-label">
                Status:
              </label>
            </Col>
            <Col size={8}>
              <div className="p-form__control" aria-labelledby="status-label">
                {settingsData?.status === "unpublished" ? (
                  <div>
                    <span className="u-margin--right">Registered</span>
                    {!isUsersSnap ? (
                      <Tooltip
                        message={
                          <>Snaps can only be unregistered by their owner.</>
                        }
                        position="top-center"
                      >
                        <Button inline={true} disabled>
                          Unregister
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        inline={true}
                        onClick={(event) => {
                          event.preventDefault();
                          setUnregisterModalOpen(true);
                        }}
                      >
                        Unregister
                      </Button>
                    )}
                  </div>
                ) : (
                  (settingsData?.status).charAt(0).toUpperCase() +
                  (settingsData?.status).slice(1)
                )}
              </div>
            </Col>
            {unregisterError && (
              <div className="u-fixed-width">
                <Notification
                  severity="negative"
                  title={unregisterErrorMessage}
                  onDismiss={() => {
                    setUnregisterError(false);
                  }}
                />
              </div>
            )}
          </Row>
        </Strip>
      </Form>

      {showMetadataWarningModal ? (
        <UpdateMetadataModal
          setShowMetadataWarningModal={setShowMetadataWarningModal}
          // @ts-expect-error Conflict between React Query and React Hook Form
          submitForm={submitForm}
          formData={formData}
        />
      ) : null}
    </>
  );
}

export default SettingsForm;
