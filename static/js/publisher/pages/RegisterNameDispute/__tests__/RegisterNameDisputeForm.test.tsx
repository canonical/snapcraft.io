import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { RecoilObserver, storesResponse } from "../../../test-utils";

import { brandStoresState } from "../../../state/brandStoreState";

import RegisterNameDisputeForm from "../RegisterNameDisputeForm";

import type { MutableSnapshot } from "recoil";

const testSnapName = "test-snap-name";
const testStoreName = "Test store";

function renderComponent() {
  render(
    <BrowserRouter>
      <RecoilRoot
        initializeState={(snapshot: MutableSnapshot) => {
          return snapshot.set(brandStoresState, storesResponse);
        }}
      >
        <RecoilObserver node={brandStoresState} event={jest.fn()} />
        <RegisterNameDisputeForm
          snapName={testSnapName}
          store={testStoreName}
          setClaimSubmitted={jest.fn()}
        />
      </RecoilRoot>
    </BrowserRouter>,
  );
}

jest.mock("react-router-dom", () => {
  return {
    ...jest.requireActual("react-router-dom"),
    useSearchParams: () => [
      new URLSearchParams({
        snap_name: testSnapName,
        store: testStoreName,
      }),
    ],
  };
});

describe("RegisterNameDisputeForm", () => {
  test("shows snap name in heading", () => {
    renderComponent();
    const el = screen.getByText("Claim the name", { exact: false });
    expect(el.textContent).toEqual(`Claim the name ${testSnapName}`);
  });

  test("shows store name in form field", () => {
    renderComponent();
    expect(screen.getByLabelText("Store")).toHaveValue(testStoreName);
  });

  test("shows snap name in form field", () => {
    renderComponent();
    expect(screen.getByLabelText("Snap name")).toHaveValue(testSnapName);
  });

  test("CTA button is disabled by default", () => {
    renderComponent();
    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  test("CTA button is enabled if comment is present", async () => {
    const user = userEvent.setup();

    renderComponent();

    await user.type(screen.getByLabelText("Comment"), "This is a test comment");

    expect(
      screen.getByRole("button", { name: "Submit name claim" }),
    ).not.toHaveAttribute("aria-disabled");
  });
});
