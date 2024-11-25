import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import SaveStateNotifications from "../SaveStateNotifications";

import type { SetStateBoolean } from "../../../types";

type Options = {
  hasSaved?: boolean;
  setHasSaved?: SetStateBoolean;
  savedError?: boolean | Array<{ message: string }>;
  setSavedError?: SetStateBoolean;
};

const renderComponent = (options: Options) => {
  return render(
    <SaveStateNotifications
      hasSaved={options.hasSaved || false}
      setHasSaved={options.setHasSaved || jest.fn()}
      savedError={options.savedError || false}
      // @ts-expect-error: This is a mock for testing purposes
      setSavedError={options.setSavedError || jest.fn()}
    />,
  );
};

describe("SaveStateNotifications", () => {
  test("shows success notification if saved", () => {
    renderComponent({ hasSaved: true });
    expect(
      screen.getByRole("heading", { name: "Changes applied successfully." }),
    ).toBeInTheDocument();
  });

  test("doesn't show success notification if not saved", () => {
    renderComponent({ hasSaved: false });
    expect(
      screen.queryByRole("heading", { name: "Changes applied successfully." }),
    ).not.toBeInTheDocument();
  });

  test("success notifcation can be closed", async () => {
    const user = userEvent.setup();
    const setHasSaved = jest.fn();
    renderComponent({ hasSaved: true, setHasSaved });
    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    expect(setHasSaved).toHaveBeenCalled();
  });

  test("shows error notification if saved", () => {
    renderComponent({ savedError: true });
    expect(
      screen.getByText(/Changes have not been saved./),
    ).toBeInTheDocument();
  });

  test("doesn't show error notification if not saved", () => {
    renderComponent({ savedError: false });
    expect(
      screen.queryByText(/Changes have not been saved./),
    ).not.toBeInTheDocument();
  });

  test("shows generic error if message is boolean", () => {
    renderComponent({ savedError: true });
    expect(screen.getByText(/Something went wrong./)).toBeInTheDocument();
  });

  test("shows custom error if message is an array", () => {
    renderComponent({
      savedError: [
        { message: "Saving error" },
        { message: "Field is required" },
      ],
    });
    expect(screen.getByText(/Saving error/)).toBeInTheDocument();
    expect(screen.getByText(/Field is required/)).toBeInTheDocument();
  });

  test("error notifcation can be closed", async () => {
    const user = userEvent.setup();
    const setHasSaved = jest.fn();
    renderComponent({ savedError: true, setHasSaved });
    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    expect(setHasSaved).toHaveBeenCalled();
  });

  test("error notifcation can be cleared", async () => {
    const user = userEvent.setup();
    const setSavedError = jest.fn();
    renderComponent({ savedError: true, setSavedError });
    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    expect(setSavedError).toHaveBeenCalled();
  });
});
