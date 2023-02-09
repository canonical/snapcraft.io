import React, { useEffect, useRef } from "react";
import { Row, Col, Button } from "@canonical/react-components";

import debounce from "../../../libs/debounce";

type Props = {
  snapName: string;
  isDirty: boolean;
  reset: Function;
  isSaving: boolean;
  isValid: boolean;
  showPreview?: boolean;
};

function SaveAndPreview({
  snapName,
  isDirty,
  reset,
  isSaving,
  showPreview,
}: Props) {
  const stickyBar = useRef<HTMLDivElement>(null);
  const handleScroll = () => {
    stickyBar?.current?.classList.toggle(
      "sticky-shadow",
      stickyBar?.current?.getBoundingClientRect()?.top === 0
    );
  };

  useEffect(() => {
    document.addEventListener("scroll", debounce(handleScroll, 10, false));
  }, []);

  return (
    <>
      <div className="snapcraft-p-sticky js-sticky-bar" ref={stickyBar}>
        <Row>
          <Col size={7}>
            <p className="u-no-margin--bottom">
              Updates to this information will appear immediately on the{" "}
              <a href={`/${snapName}`}>snap listing page</a>.
            </p>
          </Col>
          <Col size={5}>
            <div className="u-align--right">
              {showPreview && (
                <Button
                  type="submit"
                  className="p-button--base p-tooltip--btm-center"
                  aria-describedby="preview-tooltip"
                  form="preview-form"
                >
                  Preview
                  <span
                    className="p-tooltip__message"
                    role="tooltip"
                    id="preview-tooltip"
                  >
                    Previews will only work in the same browser, locally
                  </span>
                </Button>
              )}
              <Button
                appearance="default"
                disabled={!isDirty}
                type="reset"
                onClick={() => {
                  reset();
                }}
              >
                Revert
              </Button>
              <Button
                appearance="positive"
                disabled={!isDirty || isSaving}
                type="submit"
                style={{ minWidth: "68px" }}
              >
                {isSaving ? (
                  <i className="p-icon--spinner is-light u-animation--spin">
                    Saving
                  </i>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </Col>
        </Row>
      </div>
      <div className="u-fixed-width">
        <hr className="u-no-margin--bottom" />
      </div>
    </>
  );
}

export default SaveAndPreview;
