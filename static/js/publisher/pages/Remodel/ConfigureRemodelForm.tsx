import { useParams, Link, useLocation } from "react-router-dom";
import { Button, Input, Select } from "@canonical/react-components";

import { setPageTitle } from "../../utils";

function CreatePolicyForm(): React.JSX.Element {
  const { id, model_id } = useParams();
  const location = useLocation();

  if (location.pathname.includes("/configure")) {
    setPageTitle("Configure a remodel");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      style={{ height: "100%" }}
    >
      <div className="p-panel is-flex-column">
        <div className="p-panel__header">
          <h4 className="p-panel__title p-muted-heading">
            Configure a remodel
          </h4>
        </div>
        <div className="p-panel__content">
          <div className="u-fixed-width" style={{ marginBottom: "30px" }}>
            <Select
              defaultValue=""
              id="target-model"
              label="Select a target model"
              options={[
                {
                  label: "Select a model",
                  value: "",
                },
              ]}
              required
            />
            <Input
              id="input-devices"
              label="Input devices to target"
              placeholder="Enter serial number"
              type="text"
              required
            />
            <Input
              id="note"
              label="Note (Max 140 characters)"
              placeholder="Add a note (optional)"
              type="text"
              maxLength={140}
            />
          </div>
          <div className="u-fixed-width">
            <hr />
            <div className="u-align--right">
              <Link
                className="p-button u-no-margin--bottom"
                to={`/admin/${id}/models/${model_id}/remodel`}
              >
                Cancel
              </Link>
              <Button
                type="submit"
                appearance="positive"
                className="u-no-margin--bottom u-no-margin--right"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default CreatePolicyForm;
