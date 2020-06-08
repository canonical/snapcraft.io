// /* global global, jest */
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import fetchMock from "jest-fetch-mock";
import RepoConnect from "./repoConnect";

fetchMock.enableMocks();
// beforeEach(() => {
//   global.fetch = jest.fn().mockResolvedValue();
// });

// afterEach(() => {
//   global.fetch.mockRestore();
// });

beforeEach(() => {
  // fetchMock.mock("path:/publisher/github/get-repos", () => {
  //   return {
  //     body: [{ name: "jujucharms.com" }, { name: "jujucharms.com" }],
  //     headers: { "X-Some-Response-Header": "Some header value" }
  //   };
  // });
  fetchMock.mockIf(/^http:\/\/0.0.0.0:8004*$/, req => {
    if (req.url.endsWith("/get-repos")) {
      return {
        body: [{ name: "jujucharms.com" }, { name: "jujucharms.com" }],
        headers: {
          "X-Some-Response-Header": "Some header value"
        }
      };
    } else {
      return {
        status: 404,
        body: "Not Found"
      };
    }
  });
});

describe("RepoConnect", () => {
  const user = { login: "testlogin", name: "Test One", avatarUrl: "" };
  const organizations = [
    { disabled: true, value: "Select organization" },
    { value: "test-org-1" },
    { value: "test-org-2" },
    { value: "test-org-3" }
  ];

  it("renders the organizations list without errors and the list is selectable", () => {
    const { container } = render(
      <RepoConnect
        organizations={organizations}
        user={user}
        snapName="test-snap"
      />
    );

    const selectElement = container.querySelector("select");
    expect(selectElement.children.length).toEqual(4);

    expect(selectElement.value).toBeFalsy();

    fireEvent.change(selectElement, { target: { value: "test-org-1" } });
    expect(selectElement.value).toEqual("test-org-1");
    expect(container).toEqual("this");
  });

  it("renders with an error message", () => {
    const { container } = render(
      <RepoConnect
        organizations={organizations}
        user={user}
        snapName="test-snap"
      />
    );
    expect(container).toEqual("this");
  });
});
