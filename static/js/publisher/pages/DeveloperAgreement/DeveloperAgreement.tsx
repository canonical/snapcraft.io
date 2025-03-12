import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Form,
  Row,
  Col,
  Button,
  Input,
} from "@canonical/react-components";

function DeveloperAgreement(): ReactNode {
  const navigate = useNavigate();
  const [agreementAccepted, setAgreementAccepted] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  return (
    <>
      <h1 className="p-heading--2">Developer Programme Agreement</h1>

      <Card title="Snap Store Terms of Service and Privacy Notice">
        <a href="https://ubuntu.com/legal/terms-and-policies/snap-store-terms">
          Snap Store Terms of Service
        </a>
        <br />
        <a href="https://www.ubuntu.com/legal/data-privacy/snap-store">
          Privacy Notice
        </a>
      </Card>

      <Form
        onSubmit={async (e) => {
          e.preventDefault();

          setIsRedirecting(true);

          const response = await fetch("/account/agreement", {
            method: "POST",
            headers: {
              "X-CSRF-Token": window.CSRF_TOKEN,
            },
            body: JSON.stringify({ agreed: agreementAccepted }),
          });

          if (response.status === 500) {
            return (window.location.href = "/login?next=/account/agreement");
          }

          const responseData = await response.json();

          if (responseData.success) {
            setTimeout(() => {
              setIsRedirecting(false);
              navigate("/snaps");
            }, 1000);
          }
        }}
      >
        <Row>
          <Col size={8}>
            <Input
              type="checkbox"
              label="I agree to the terms and privacy notice"
              onChange={(e) => {
                setAgreementAccepted(e.target.checked);
              }}
            />
          </Col>
          <Col size={4} className="u-align--right">
            <a className="p-button" href="/">
              Cancel
            </a>
            <Button
              type="submit"
              appearance="positive"
              disabled={!agreementAccepted || isRedirecting}
            >
              {isRedirecting ? (
                <>
                  <i className="p-icon--spinner u-animation--spin is-light"></i>
                  &nbsp;Redirecting
                </>
              ) : (
                <>Continue</>
              )}
            </Button>
          </Col>
        </Row>
      </Form>
    </>
  );
}

export default DeveloperAgreement;
