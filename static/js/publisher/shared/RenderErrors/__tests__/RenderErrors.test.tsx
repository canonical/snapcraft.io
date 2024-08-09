import { screen, render } from "@testing-library/react";
import "@testing-library/jest-dom";

import RenderErrors from "../RenderErrors";

describe("RenderErrors", () => {
  test("renders errors", () => {
    render(
      <RenderErrors
        errors={{
          file: ["error message one", "error message two"],
        }}
      />
    );
    expect(screen.getByText(/error message one/)).toBeInTheDocument();
    expect(screen.getByText(/error message two/)).toBeInTheDocument();
  });
});
