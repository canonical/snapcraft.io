import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Settings from "./Settings";
import store from "../store";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test" }),
}));

let initialState = {};

const setupMockSelector = (state) => {
  useSelector.mockImplementation((callback) => {
    return callback(state);
  });
};

beforeEach(() => {
  initialState = {
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

  expect(screen.getByLabelText("Store ID").value).toEqual(
    initialState.currentStore.currentStore.id
  );
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

  const radioButtons = screen.getAllByRole("radio");
  const checkedRadioButton = radioButtons.find(
    (button) => button.checked === true
  );

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
