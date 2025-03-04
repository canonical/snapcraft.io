import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import RegisterNameDisputeSuccess from "../RegisterNameDisputeSuccess";

function renderComponent() {
  return render(
    <BrowserRouter>
      <RegisterNameDisputeSuccess snapName="test-snap" />
    </BrowserRouter>,
  );
}

describe("RegisterNameDisputeSuccess", () => {
  test("the snap name is shown", () => {
    renderComponent();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Thank you for requesting the name test-snap/,
      }),
    );
  });
});
