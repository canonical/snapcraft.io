import React from "react";
import { Button } from "@canonical/react-components";

type Props = {
  snapName: string;
  isDirty: boolean;
  reset: Function;
};

function SaveAndPreview({ snapName, isDirty, reset }: Props) {
  return (
    <div className="snapcraft-p-sticky">
      <div className="row">
        <div className="col-7">
          <p className="u-no-margin--bottom">
            Updates to this information will appear immediately on the{" "}
            <a href={`/${snapName}`}>snap listing page</a>.
          </p>
        </div>
        <div className="col-5">
          <div className="u-align--right">
            <Button
              type="button"
              className="p-tooltip--btm-center"
              aria-describedby="preview-tooltip"
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
            <Button appearance="positive" disabled={!isDirty} type="submit">
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SaveAndPreview;
