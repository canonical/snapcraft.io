import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import UpdateMetadataModal from "../UpdateMetadataModal";

const setShowMetadataWarningModal = jest.fn();
const submitForm = jest.fn();
const formData = {
  blacklist_countries: [],
  blacklist_country_keys: "",
  countries: [],
  country_keys_status: "",
  private: false,
  publisher_name: "",
  snap_id: "",
  snap_name: "",
  snap_title: "",
  status: "",
  store: "",
  territory_distribution_status: "",
  unlisted: false,
  update_metadata_on_release: false,
  visibility: "",
  visibility_locked: false,
  whitelist_countries: [],
  whitelist_country_keys: "",
};

const renderComponent = () => {
  return render(
    <UpdateMetadataModal
      setShowMetadataWarningModal={setShowMetadataWarningModal}
      submitForm={submitForm}
      formData={formData}
    />,
  );
};

describe("UpdateMetadataModal", () => {
  test("cancel button closes modal", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(setShowMetadataWarningModal).toHaveBeenCalledWith(false);
    });
  });

  test("save button submits form and closes modal", async () => {
    const user = userEvent.setup();
    renderComponent();
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => {
      expect(setShowMetadataWarningModal).toHaveBeenCalledWith(false);
      expect(submitForm).toHaveBeenCalledWith(formData);
    });
  });
});
