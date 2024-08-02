import { useState } from "react";
import { nanoid } from "nanoid";
import { Row, Col, Modal } from "@canonical/react-components";

import { useVerified } from "../../hooks";

type Props = {
  snapName: string | undefined;
  register: Function;
  getFieldState: Function;
  getValues: Function;
  formState: { [key: string]: any };
};

function PrimaryDomainInput({
  snapName,
  register,
  getFieldState,
  getValues,
  formState,
}: Props) {
  const id = nanoid();
  const fieldState = getFieldState("primary_website");
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const { isLoading, status, data } = useVerified(snapName);
  const domain = getValues("primary_website");
  const defaultDomain = formState.defaultValues.primary_website;
  const verificationToken = `SNAPCRAFT_IO_VERIFICATION=${window.DNS_VERIFICATION_TOKEN}`;

  const noPathDomains = [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "launchpad.net",
    "sourceforge.net",
  ];

  const formatUrl = (url: string) => {
    const urlWithoutProtocol = url.split("://")[1];

    if (urlWithoutProtocol.charAt(urlWithoutProtocol.length - 1) === "/") {
      return urlWithoutProtocol.slice(0, -1);
    }

    return urlWithoutProtocol;
  };

  const domainChanged = () => {
    if (!getValues("primary_website")) {
      return false;
    }

    const initialUrl = new URL(defaultDomain);

    try {
      const newUrl = new URL(getValues("primary_website"));
      return initialUrl.hostname !== newUrl.hostname;
    } catch (e) {
      return false;
    }
  };

  const pathChanged = () => {
    if (!getValues("primary_website")) {
      return false;
    }

    const initialUrl = new URL(defaultDomain);

    try {
      const newUrl = new URL(getValues("primary_website"));
      return initialUrl.pathname !== newUrl.pathname;
    } catch (e) {
      return false;
    }
  };

  const domainInNoPathList = () => {
    if (!getValues("primary_website")) {
      return false;
    }

    try {
      const newUrl = new URL(getValues("primary_website"));
      return noPathDomains.includes(newUrl.hostname);
    } catch (e) {
      return false;
    }
  };

  const getHostname = (url: string | undefined) => {
    if (!url) {
      return "";
    } else {
      return new URL(url).hostname;
    }
  };

  return (
    <>
      <Row
        className={`p-form__group ${
          fieldState.invalid && "p-form-validation is-error"
        }`}
      >
        <Col size={2}>
          <label htmlFor={id} className="p-form__label">
            Primary website:
          </label>
        </Col>
        <Col size={5}>
          <div className="p-form__control">
            <input
              type={"url"}
              id={id}
              className="p-form-validation__input"
              {...register("primary_website")}
            />
          </div>
        </Col>
        <Col size={5}>
          {!isLoading && status === "success" && data && (
            <>
              {data.primary_domain && (
                <>
                  {fieldState.isDirty && (
                    <>
                      {!domainChanged() &&
                        pathChanged() &&
                        domainInNoPathList() && (
                          <>
                            Unable to verify{" "}
                            <strong>
                              {getHostname(
                                formState.defaultValues.primary_website
                              )}
                            </strong>{" "}
                            with a path
                          </>
                        )}

                      {!domainChanged() &&
                        pathChanged() &&
                        !domainInNoPathList() && (
                          <button
                            type="button"
                            className="p-button--base has-icon"
                            onClick={() => {
                              setShowVerifyModal(true);
                            }}
                            disabled={fieldState.isDirty}
                          >
                            <span>Verified ownership</span>
                            <i className="p-icon--chevron-right"></i>
                          </button>
                        )}

                      {!domainChanged() && !pathChanged() && (
                        <button
                          type="button"
                          className="p-button--base has-icon"
                          onClick={() => {
                            setShowVerifyModal(true);
                          }}
                          disabled={fieldState.isDirty}
                        >
                          <span>Verified ownership</span>
                          <i className="p-icon--chevron-right"></i>
                        </button>
                      )}

                      {domainChanged() && !domainInNoPathList() && (
                        <>
                          Please save your changes to verify{" "}
                          {getValues("primary_website")}
                        </>
                      )}
                    </>
                  )}

                  {!fieldState.isDirty && (
                    <button
                      type="button"
                      className="p-button--base has-icon"
                      onClick={() => {
                        setShowVerifyModal(true);
                      }}
                      disabled={fieldState.isDirty}
                    >
                      <span>Verified ownership</span>
                      <i className="p-icon--chevron-right"></i>
                    </button>
                  )}
                </>
              )}

              {defaultDomain &&
                getValues("primary_website") &&
                !data.primary_domain && (
                  <button
                    type="button"
                    className="p-button has-icon"
                    onClick={() => {
                      setShowVerifyModal(true);
                    }}
                    disabled={fieldState.isDirty}
                  >
                    <span>Verify ownership</span>
                    <i className="p-icon--chevron-right"></i>
                  </button>
                )}
            </>
          )}
        </Col>
      </Row>
      {showVerifyModal && (
        <Modal
          title="Verify ownership"
          close={() => {
            setShowVerifyModal(false);
          }}
        >
          <p>
            To verify ownership of <strong>{formatUrl(domain)}</strong> copy and
            paste the text below as a TXT Record in your DNS Records. Please
            allow for up to 24 hours for verification.
          </p>

          <div style={{ display: "flex" }}>
            <label className="u-off-screen" htmlFor="verification-token">
              DNS verification token
            </label>
            <input
              type="text"
              readOnly
              value={verificationToken}
              name="verification-token"
              id="verification-token"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(verificationToken);
              }}
            >
              <i className="p-icon--copy">Copy token</i>
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export default PrimaryDomainInput;
