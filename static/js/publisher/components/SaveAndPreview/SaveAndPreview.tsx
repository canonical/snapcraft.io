import { useEffect, useRef } from "react";
import { Row, Col, Button } from "@canonical/react-components";

import debounce from "../../../libs/debounce";

type Props = {
  snapName: string;
  isDirty: boolean;
  reset: () => void;
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
}: Props): React.JSX.Element {
  const stickyBar = useRef<HTMLDivElement>(null);
  const mainPanel = document.querySelector(".l-main") as HTMLElement;

  const handleScroll = (): void => {
    stickyBar?.current?.classList.toggle(
      "sticky-shadow",
      stickyBar?.current?.getBoundingClientRect()?.top === 0,
    );
  };

  if (mainPanel) {
    mainPanel.addEventListener("scroll", debounce(handleScroll, 10, false));
  }

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    const handlePreviewAction = (event: MessageEvent): void => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const data = event.data as { type?: string; action?: string } | null;
      if (!data || data.type !== "snapcraft-preview-action") {
        return;
      }

      const sourceWindow = event.source as Window | null;
      const closePreview = (): void => {
        if (sourceWindow && typeof sourceWindow.close === "function") {
          sourceWindow.close();
        }
      };

      if (data.action === "revert") {
        if (isDirty) {
          reset();
        }
        closePreview();
        return;
      }

      if (data.action === "save") {
        if (!isDirty || isSaving) {
          closePreview();
          return;
        }

        const formElement =
          (stickyBar.current?.closest("form") as HTMLFormElement | null) ??
          null;
        if (!formElement) {
          return;
        }

        if (typeof formElement.requestSubmit === "function") {
          formElement.requestSubmit();
        } else {
          formElement.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true }),
          );
        }
        closePreview();
      }
    };

    window.addEventListener("message", handlePreviewAction);
    return () => {
      window.removeEventListener("message", handlePreviewAction);
    };
  }, [isDirty, isSaving, reset, showPreview]);

  return (
    <>
      <div
        className="snapcraft-p-sticky js-sticky-bar"
        ref={stickyBar}
        style={{ margin: "0 -1.5rem", padding: "0 1.5rem" }}
      >
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
                data-js="save-and-preview-revert"
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
                data-js="save-and-preview-save"
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
