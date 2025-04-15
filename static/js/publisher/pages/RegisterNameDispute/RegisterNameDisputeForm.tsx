import { useState, Dispatch, SetStateAction } from "react";
import {
  Form,
  Input,
  Textarea,
  Row,
  Col,
  Button,
} from "@canonical/react-components";

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

  return (
    <>
      <h1 className="p-heading--2">
        Claim the name <strong>{snapName}</strong>
      </h1>
      <p>Request the transfer of this snap name from its current owner</p>
      <Form
        stacked
        onSubmit={async (e) => {
          e.preventDefault();

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
        <Row>
          <Col size={8}>
            <Input
              type="text"
              readOnly
              stacked
              label="Store"
              value={store || ""}
            />
            <Input
              type="text"
              readOnly
              stacked
              label="Snap name"
              value={snapName || ""}
            />
            <Textarea
              label="Comment"
              help="Why you have rights to claim this name"
              stacked
              defaultValue={claimComment}
              onChange={(e) => {
                setClaimComment(e.target.value);
              }}
            />
          </Col>
        </Row>
        <hr />
        <div className="u-align--right">
          <a className="p-button" href="/register-snap">
            Register a new name
          </a>
          <Button
            type="submit"
            appearance="positive"
            disabled={isSending || !claimComment}
          >
            {isSending ? (
              <>
                <i className="p-icon--spinner u-animation--spin is-light"></i>
                &nbsp;Submitting
              </>
            ) : (
              <>Submit name claim</>
            )}
          </Button>
        </div>
      </Form>
    </>
  );
}

export default RegisterNameDisputeForm;
