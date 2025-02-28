import { useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Form,
  Input,
  Button,
  Card,
} from "@canonical/react-components";

import { setPageTitle } from "../../utils";

function DeveloperAgreement(): ReactNode {
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const navigate = useNavigate();

  setPageTitle("Developer Programme Agreement");

  return (
    <>
      <div className="u-fixed-width">
        <h1 className="p-heading--2">Developer Agreement Programme</h1>

        <Card title="Snap Store Terms of Service and Privacy Notice">
          <a
            href="https://ubuntu.com/legal/terms-and-policies/snap-store-terms"
            target="_blank"
            rel="noreferrer"
          >
            Snap Store Terms of Service
          </a>
          <br />
          <a
            href="https://www.ubuntu.com/legal/data-privacy/snap-store"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Notice
          </a>
        </Card>

        <Form
          onSubmit={async (e) => {
            e.preventDefault();

            setIsSending(true);

            const response = await fetch("/account/agreement", {
              method: "POST",
              headers: {
                "X-CSRF-Token": window.CSRF_TOKEN,
              },
              body: JSON.stringify({
                i_agree: agreementAccepted ? "on" : "off",
              }),
            });

            if (!response.ok) {
              setIsSending(false);
              throw new Error("Unable to submit agreement");
            }

            const responseData = await response.json();

            setTimeout(() => {
              setIsSending(false);

              if (responseData.success) {
                navigate("/snaps");
              }
            }, 1000);
          }}
        >
          <Row>
            <Col size={8}>
              <Input
                type="checkbox"
                label="I agree to the terms and privacy notice"
                defaultChecked={agreementAccepted}
                onChange={(e) => {
                  setAgreementAccepted(e.target.checked);
                }}
              />
            </Col>
            <Col size={4} className="u-align--right">
              <a href="/" className="p-button">
                Cancel
              </a>
              <Button
                type="submit"
                appearance="positive"
                disabled={!agreementAccepted || isSending}
              >
                {isSending ? (
                  <>
                    <i className="p-icon--spinner u-animation--spin is-light"></i>
                    &nbsp;Sending
                  </>
                ) : (
                  <>Continue</>
                )}
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </>
  );
}

export default DeveloperAgreement;
