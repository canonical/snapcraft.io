import { useState, SyntheticEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Row,
  Col,
  RadioInput,
  CheckboxInput,
} from "@canonical/react-components";

function PubliciseCards(): JSX.Element {
  const { snapId } = useParams();
  const [buttonType, setButtonType] = useState<"black" | "white" | "hidden">(
    "black"
  );
  const [showAllChannels, setShowAllChannels] = useState<boolean>(true);
  const [showSummary, setShowSummary] = useState<boolean>(true);
  const [showScreenshot, setShowScreenshot] = useState<boolean>(true);

  const iframeQueryParameters: { [key: string]: string } = {};

  if (buttonType !== "hidden") {
    iframeQueryParameters["button"] = buttonType;
  }

  if (showAllChannels) {
    iframeQueryParameters["channels"] = "true";
  }

  if (showSummary) {
    iframeQueryParameters["summary"] = "true";
  }

  if (showScreenshot) {
    iframeQueryParameters["screenshot"] = "true";
  }

  const iframeQueryString = new URLSearchParams(
    iframeQueryParameters
  ).toString();

  const htmlSnippet = `<iframe src="https://snapcraft.io/${snapId}/embedded?${iframeQueryString}"width="100%" height="990px" style="border: 1px solid #CCC; border-radius: 2px;"></iframe>`;

  return (
    <>
      <Row>
        <Col size={2}>
          <label>Snap Store button:</label>
        </Col>
        <Col size={10}>
          <p>
            <RadioInput
              name="button-type"
              label="Dark"
              checked={buttonType === "black"}
              onChange={() => {
                setButtonType("black");
              }}
            />
            <RadioInput
              name="button-type"
              label="Light"
              checked={buttonType === "white"}
              onChange={() => {
                setButtonType("white");
              }}
            />
            <RadioInput
              name="button-type"
              label="Hide button"
              checked={buttonType === "hidden"}
              onChange={() => {
                setButtonType("hidden");
              }}
            />
          </p>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <label>Options:</label>
        </Col>
        <Col size={10}>
          <p>
            <CheckboxInput
              label="Show all channels"
              checked={showAllChannels}
              onChange={(
                e: SyntheticEvent<HTMLInputElement> & {
                  target: HTMLInputElement;
                }
              ) => {
                setShowAllChannels(e.target.checked);
              }}
            />
            <CheckboxInput
              label="Show summary"
              checked={showSummary}
              onChange={(
                e: SyntheticEvent<HTMLInputElement> & {
                  target: HTMLInputElement;
                }
              ) => {
                setShowSummary(e.target.checked);
              }}
            />
            <CheckboxInput
              label="Show screenshot"
              checked={showScreenshot}
              onChange={(
                e: SyntheticEvent<HTMLInputElement> & {
                  target: HTMLInputElement;
                }
              ) => {
                setShowScreenshot(e.target.checked);
              }}
            />
          </p>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <label>Preview:</label>
        </Col>
        <Col size={8}>
          <p>
            <iframe
              src={`/${snapId}/embedded?${iframeQueryString}`}
              width="100%"
              style={{
                border: "1px solid rgb(204, 204, 204)",
                borderRadius: "2px",
                height: "990px",
              }}
            ></iframe>
          </p>
        </Col>
      </Row>
      <Row>
        <Col size={2}>
          <label>HTML:</label>
        </Col>
        <Col size={10}>
          <div className="p-code-snippet">
            <pre className="p-code-snippet__block is-wrapped">
              {htmlSnippet}
            </pre>
          </div>
        </Col>
      </Row>
    </>
  );
}

export default PubliciseCards;
