import { BrowserRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import "@testing-library/jest-dom";
import { useAtomValue } from "jotai";

import ModelNav from "../ModelNav";
import { brandIdState } from "../../../state/brandStoreState";
import { userPrivilegesState } from "../../../state/userPrivilegesState";
import type { UserPrivileges } from "../../../types/shared";

const brandId = "test-brand-id";
let userPrivileges: UserPrivileges;

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: vi.fn(() => ({ id: "test-id", modelId: "test-model-id" })),
  };
});

vi.mock("jotai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jotai")>();

  return {
    ...actual,
    useAtomValue: vi.fn(),
  };
});

const renderComponent = (sectionName: string) => {
  return render(
    <BrowserRouter>
      <ModelNav sectionName={sectionName} />
    </BrowserRouter>,
  );
};

describe("ModelNav", () => {
  const mockUseAtomValue = vi.mocked(useAtomValue);

  beforeEach(() => {
    vi.clearAllMocks();
    userPrivileges = {
      account: {
        "display-name": "Test User",
        email: "test@example.com",
        id: "test-user-id",
        username: "test-user",
      },
      "brand-permissions": {
        [brandId]: ["read-remodel-allowlist", "read-serial-log"],
      },
      permissions: [],
    };
    mockUseAtomValue.mockImplementation((atom) => {
      if (atom === brandIdState) {
        return brandId;
      }

      if (atom === userPrivilegesState) {
        return userPrivileges;
      }
    });
  });

  it("highlights the correct navigation item", () => {
    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Policies" });
    expect(currentLink.getAttribute("aria-selected")).toBe("true");
  });

  it("doesn't highlight other navigation links", () => {
    renderComponent("policies");
    const currentLink = screen.getByRole("tab", { name: "Overview" });
    expect(currentLink.getAttribute("aria-selected")).toBe("false");
  });

  it("shows Remodel tab when user can read the remodel allowlist", () => {
    userPrivileges!["brand-permissions"][brandId] = ["read-remodel-allowlist"];

    renderComponent("overview");
    expect(screen.getByRole("tab", { name: "Remodel" })).toBeInTheDocument();
  });

  it("hides Remodel tab when user cannot read the remodel allowlist", () => {
    userPrivileges!["brand-permissions"][brandId] = ["read-serial-log"];

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
  });

  it("shows Serial log tab when user can read the serial log", () => {
    userPrivileges!["brand-permissions"][brandId] = ["read-serial-log"];

    renderComponent("overview");
    expect(screen.getByRole("tab", { name: "Serial log" })).toBeInTheDocument();
  });

  it("hides Serial log tab when user cannot read the serial log", () => {
    userPrivileges!["brand-permissions"][brandId] = ["read-remodel-allowlist"];

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Serial log" }),
    ).not.toBeInTheDocument();
  });

  it("hides permission-based tabs when brand permissions are missing", () => {
    userPrivileges!["brand-permissions"] = {};

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Serial log" }),
    ).not.toBeInTheDocument();
  });

  it("hides permission-based tabs when user privileges are not loaded", () => {
    userPrivileges = null;

    renderComponent("overview");
    expect(
      screen.queryByRole("tab", { name: "Remodel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Serial log" }),
    ).not.toBeInTheDocument();
  });
});
