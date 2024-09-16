import { screen, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import UpdateMetadataModal from "../UpdateMetadataModal";

const setShowMetadataWarningModal = jest.fn();
const submitForm = jest.fn();
const formData = {};

const renderComponent = () => {
  return render(
    <UpdateMetadataModal
      setShowMetadataWarningModal={setShowMetadataWarningModal}
      submitForm={submitForm}
      formData={formData}
    />
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
