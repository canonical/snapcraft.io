import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useRecoilValue } from "recoil";
import {
  Form,
  Button,
  Input,
  Textarea,
  Row,
  Col,
  Notification,
  Icon,
} from "@canonical/react-components";

import { brandStoresState } from "../../state/brandStoreState";

function RequestReservedName(): React.JSX.Element {
  const [claimComment, setClaimComment] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>();
  const [showSuccessNotification, setShowSuccessNotification] =
    useState<boolean>(false);
  const [errorNotification, setErrorNotification] = useState<string>();
  const stores = useRecoilValue(brandStoresState);
  const [searchParams] = useSearchParams();
  const snapName = searchParams.get("snap_name");
  const store = searchParams.get("store");

  const selectedStore = stores.find((s) => s.name === store) || {
    name: "Global",
    id: "ubuntu",
  };

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
          <Icon name="spinner" className="u-animation--spin" />
          &nbsp;Loading data...
        </>
      )}

      {stores.length > 0 && (
        <Form
          onSubmit={async (e) => {
            e.preventDefault();

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
          <Row>
            <Col size={2}>
              <label htmlFor="store">Store</label>
            </Col>
            <Col size={6}>
              <Input
                type="text"
                readOnly
                id="store"
                value={selectedStore.name}
              />
            </Col>
          </Row>

          <Row>
            <Col size={2}>
              <label htmlFor="snap">Snap name</label>
            </Col>
            <Col size={6}>
              <Input type="text" id="snap" readOnly value={snapName || ""} />
            </Col>
          </Row>

          <Row>
            <Col size={2}>
              <label htmlFor="comment">Comment</label>
            </Col>
            <Col size={6}>
              <Textarea
                id="comment"
                help="Why you have rights to claim this name"
                value={claimComment}
                onChange={(e) => {
                  setClaimComment(e.target.value);
                }}
              />
            </Col>
          </Row>
          <hr />
          <div className="u-align--right">
            <Link to="/register-snap" className="p-button">
              Register snap
            </Link>
            <Button
              type="submit"
              appearance="positive"
              disabled={!claimComment || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon name="spinner" className="u-animation--spin" light />
                  &nbsp;Requesting
                </>
              ) : (
                <>Yes, I am sure</>
              )}
            </Button>
          </div>
        </Form>
      )}
    </>
  );
}

export default RequestReservedName;
