import React from "react";
import { Provider, useSelector } from "react-redux";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import Settings from "./Settings";
import store from "../stores/store";

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test" }),
}));

describe("<Settings />", () => {
  const testState = {
    currentStore: {
      currentStore: {
        id: "test",
        private: true,
        "manual-review-policy": "allow",
      },
    },
  };

  beforeEach(() => {
    useSelector.mockImplementation((callback) => {
      return callback(testState);
    });
  });

  it("should render the Settings view", () => {
    render(
      <Provider store={store}>
        <Settings />
      </Provider>
    );
    expect(document.querySelector("#is_public")).toBeInTheDocument();
  });
});
