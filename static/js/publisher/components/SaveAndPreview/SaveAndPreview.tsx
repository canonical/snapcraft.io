import { useEffect, useRef } from "react";
import { Row, Col } from "@canonical/react-components";
import { Button, withTooltip } from "@canonical/react-ds-global";

import debounce from "../../../libs/debounce";

type Props = {
  snapName: string;
  isDirty: boolean;
  reset: () => void;
  isSaving: boolean;
  isValid: boolean;
  showPreview?: boolean;
};

const PreviewButtonWithTooltip = withTooltip(
  Button,
  <>Previews will only work in the same browser, locally</>,
);

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
        className="snapcraft-p-sticky"
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
                // Must wrap to set the right margin because the `Button`
                // within `PreviewButtonWithTooltip` is wrapped, and these
                // styles go directly to the `Button` component, therefore
                // the spacing doesn't take effect
                <span style={{ marginRight: "1rem" }}>
                  <PreviewButtonWithTooltip
                    aria-describedby="preview-tooltip"
                    type="submit"
                    form="preview-form"
                    importance="tertiary"
                  >
                    Preview
                  </PreviewButtonWithTooltip>
                </span>
              )}
              <Button
                importance="secondary"
                className="u-no-margin--bottom"
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
                anticipation="constructive"
                importance="primary"
                className="u-no-margin--bottom"
                disabled={!isDirty || isSaving}
                type="submit"
                // Needed so save loading button doesn't cause a jump
                style={{ width: "68px" }}
                loading={isSaving}
                data-js="save-and-preview-save"
              >
                {isSaving ? "Saving" : "Save"}
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
