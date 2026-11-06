import { useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { useAtomValue } from "jotai";
import { Notification, Row, Col } from "@canonical/react-components";
import { Button, Icon } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm } from "react-hook-form";
import type { FieldValues } from "react-hook-form";

import RouterLinkButton from "../../components/RouterLinkButton";
import { brandStoresState } from "../../state/brandStoreState";

function RequestReservedName(): React.JSX.Element {
  const [claimComment, setClaimComment] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>();
  const [showSuccessNotification, setShowSuccessNotification] =
    useState<boolean>(false);
  const [errorNotification, setErrorNotification] = useState<string>();
  const stores = useAtomValue(brandStoresState);
  const [searchParams] = useSearchParams();
  const snapName = searchParams.get("snap_name");
  const store = searchParams.get("store");

  const selectedStore = stores.find((s) => s.name === store) || {
    name: "Global",
    id: "ubuntu",
  };

  const methods = useForm<FieldValues>({
    values: {
      store: selectedStore.name,
      snapName: snapName || "",
      comment: claimComment ?? "",
    },
  });

  return (
    <>
      <h1 className="p-heading--2">
        Request reserved name <strong>{snapName}</strong>
      </h1>

      {showSuccessNotification && (
        <Notification severity="positive">
          Your claim has been submitted and will be reviewed
        </Notification>
      )}

      {errorNotification && (
        <Notification severity="caution">{errorNotification}</Notification>
      )}

      {stores.length === 0 && (
        <>
          <Icon icon="spinner" className="u-animation--spin" />
          &nbsp;Loading data...
        </>
      )}

      {stores.length > 0 && (
        <Row>
          <Col size={8}>
            <Form
              methods={methods}
              onSubmit={async () => {
                setIsSubmitting(true);

                const response = await fetch("/api/register-name-dispute", {
                  method: "POST",
                  headers: {
                    "X-CSRFToken": window.CSRF_TOKEN,
                  },
                  body: JSON.stringify({
                    "snap-name": snapName,
                    "claim-comment": claimComment,
                  }),
                });

                if (!response.ok) {
                  setIsSubmitting(false);
                  throw new Error("Unable to request reserved name");
                }

                const responseData = await response.json();

                if (!responseData.success) {
                  setErrorNotification(responseData.message);
                } else {
                  setShowSuccessNotification(true);
                }

                setIsSubmitting(false);
              }}
            >
              <Field
                inputType="text"
                name="store"
                id="store"
                label="Store"
                readOnly
                isOptional
              />
              <Field
                inputType="text"
                name="snapName"
                id="snap"
                label="Snap name"
                readOnly
                isOptional
              />
              <Field
                inputType="textarea"
                name="comment"
                id="comment"
                label="Comment"
                description="Why you have rights to claim this name"
                registerProps={{
                  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
                    setClaimComment(event.target.value);
                  },
                }}
              />
              <p className="ds field-description p">* Mandatory field</p>
              <div>
                <hr className="pragma-hr" />
                <div className="u-align--right">
                  <RouterLinkButton importance="secondary" to="/register-snap">
                    Register snap
                  </RouterLinkButton>
                  <Button
                    type="submit"
                    importance="primary"
                    anticipation="constructive"
                    style={{ marginLeft: "1rem" }}
                    disabled={!claimComment || isSubmitting}
                    loading={isSubmitting}
                  >
                    {isSubmitting ? "Requesting" : "Yes, I am sure"}
                  </Button>
                </div>
              </div>
            </Form>
          </Col>
        </Row>
      )}
    </>
  );
}

export default RequestReservedName;
