import { useState } from "react";
import type { Dispatch, SetStateAction, ChangeEvent } from "react";
import { Row, Col } from "@canonical/react-components";
import { Button } from "@canonical/react-ds-global";
import { Field, Form } from "@canonical/react-ds-global-form";
import { useForm } from "react-hook-form";
import type { FieldValues } from "react-hook-form";

import RouterLinkButton from "../../components/RouterLinkButton";

type Props = {
  snapName: string | null;
  store: string | undefined;
  setClaimSubmitted: Dispatch<SetStateAction<boolean>>;
};

function RegisterNameDisputeForm({
  snapName,
  store,
  setClaimSubmitted,
}: Props): React.JSX.Element {
  const [claimComment, setClaimComment] = useState<string>();
  const [isSending, setIsSending] = useState<boolean>();

  const methods = useForm<FieldValues>({
    values: {
      store: store || "",
      snapName: snapName || "",
      comment: claimComment ?? "",
    },
  });

  return (
    <>
      <h1 className="p-heading--2">
        Claim the name <strong>{snapName}</strong>
      </h1>
      <p>Request the transfer of this snap name from its current owner</p>
      <Row>
        <Col size={8}>
          <Form
            methods={methods}
            onSubmit={async () => {
              setIsSending(true);

              const response = await fetch("/api/register-name-dispute", {
                method: "POST",
                headers: {
                  "X-CSRF-Token": window.CSRF_TOKEN,
                },
                body: JSON.stringify({
                  "snap-name": snapName,
                  "claim-comment": claimComment,
                  store,
                }),
              });

              if (!response.ok) {
                setIsSending(false);
                throw new Error("Unable to register name dispute");
              }

              setIsSending(false);
              setClaimSubmitted(true);
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
              id="snap-name"
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
                  Register a new name
                </RouterLinkButton>
                <Button
                  type="submit"
                  importance="primary"
                  anticipation="constructive"
                  style={{ marginLeft: "1rem" }}
                  disabled={isSending || !claimComment}
                  loading={isSending}
                >
                  {isSending ? "Submitting" : "Submit name claim"}
                </Button>
              </div>
            </div>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default RegisterNameDisputeForm;
