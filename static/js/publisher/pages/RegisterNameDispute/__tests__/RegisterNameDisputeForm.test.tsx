import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RegisterNameDisputeForm from "../RegisterNameDisputeForm";

function renderComponent() {
  return render(
    <BrowserRouter>
      <RegisterNameDisputeForm
        snapName="test-snap"
        store="Test store"
        setClaimSubmitted={jest.fn()}
      />
    </BrowserRouter>,
  );
}

describe("RegisterNameDisputeForm", () => {
  test("shows store name", () => {
    renderComponent();
    expect(screen.getByLabelText("Store")).toHaveValue("Test store");
  });

  test("shows the correct snap name", () => {
    renderComponent();
    expect(screen.getByLabelText("Snap name")).toHaveValue("test-snap");
  });
});
