import React from "react";
import * as reactRedux from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Settings from "./Settings";
import store from "../store";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test" }),
}));

function getInitialState() {
  return {
    currentStore: {
      currentStore: {
        id: "test-id",
        private: true,
        "manual-review-policy": "allow",
      },
    },
    members: {
      members: [
        {
          id: "testid",
          current_user: true,
          roles: ["admin"],
        },
      ],
      loading: false,
    },
  };
}

interface Member {}

interface State {
  currentStore: {
    currentStore: {
      id: string;
      private: Boolean;
      "manual-review-policy": string;
    };
  };
  members: {
    members: Array<Member>;
    loading: Boolean;
  };
}

let initialState: State = getInitialState();

const mockSelector = jest.spyOn(reactRedux, "useSelector");
const setupMockSelector = (state: State) => {
  mockSelector.mockImplementation((callback: any) => {
    return callback(state);
  });
};

beforeEach(() => {
  initialState = getInitialState();
});

test("the 'is public' checkbox should not be checked when the current store is set to private", () => {
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  expect(
    screen.getByLabelText("Include this store in public lists")
  ).not.toBeChecked();
});

test("the 'is public' checkbox should be checked when the current store is not set to private", () => {
  initialState.currentStore.currentStore.private = false;
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  expect(
    screen.getByLabelText("Include this store in public lists")
  ).toBeChecked();
});

test("the correct value is given to the store ID field", () => {
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  const storeIdInput = screen.getByLabelText("Store ID") as HTMLInputElement;

  expect(storeIdInput.value).toEqual(initialState.currentStore.currentStore.id);
});

test("the correct radio button is checked by default for manual review policy", () => {
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  const checkedRadioButton = screen.getByRole("radio", {
    checked: true,
  }) as HTMLInputElement;

  expect(checkedRadioButton.value).toEqual(
    initialState.currentStore.currentStore["manual-review-policy"]
  );
});

test("the save button is disabled by default", () => {
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  expect(screen.getByText("Save changes")).toBeDisabled();
});

test("the save button is enabled when the data changes", () => {
  setupMockSelector(initialState);

  render(
    <Provider store={store}>
      <Router>
        <Settings />
      </Router>
    </Provider>
  );

  screen.getByRole("checkbox").click();
  expect(screen.getByText("Save changes")).not.toBeDisabled();
});
