import React from "react";
import { render } from "@testing-library/react";
import RepoConnect from "./repoConnect";

const essentialProps = {
  user: {
    login: "test-login",
    name: "Test Name",
    avatarUrl: "https://assets.ubuntu.com/v1/0a529437-karlos.jpeg",
  },
  organizations: [
    { disabled: true, value: "Select organization" },
    { value: "test-org-1" },
    { value: "test-org-2" },
    { value: "test-org-3" },
  ],
  snapName: "test-snap",
};

describe("RepoConnect", () => {
  it("should render all critical elements", () => {
    const { container, queryByPlaceholderText } = render(
      <RepoConnect {...essentialProps} />
    );

    expect(container.querySelectorAll("input").length).toEqual(2);
    expect(container.querySelector("select")).toBeTruthy();
    expect(queryByPlaceholderText("Search your repos")).toBeTruthy();
  });

  it("should render all organizations", () => {
    const { queryByText } = render(<RepoConnect {...essentialProps} />);

    essentialProps.organizations.forEach((el) => {
      expect(queryByText(el.value)).toBeTruthy();
    });
  });
});
