import "@testing-library/jest-dom";
import { waitFor } from "@testing-library/dom";

const originalFetch = global.fetch;

const createAccountNavigationFixture = () => {
  document.body.innerHTML = `
    <div class="js-nav-account">
      <div class="js-nav-account--notauthenticated">Sign in</div>
      <div class="js-nav-account--authenticated u-hide">
        <span class="js-account--name"></span>
        <a class="js-nav-account--stores u-hide" href="/stores">Stores</a>
        <a class="js-nav-account--validation-sets u-hide" href="/sets">
          Validation sets
        </a>
      </div>
    </div>
  `;

  return {
    notAuthenticatedMenu: document.querySelector(
      ".js-nav-account--notauthenticated",
    ) as HTMLElement,
    authenticatedMenu: document.querySelector(
      ".js-nav-account--authenticated",
    ) as HTMLElement,
    displayName: document.querySelector(".js-account--name") as HTMLElement,
    storesMenu: document.querySelector(
      ".js-nav-account--stores",
    ) as HTMLElement,
    validationSetsMenu: document.querySelector(
      ".js-nav-account--validation-sets",
    ) as HTMLElement,
  };
};

const mockAccountFetch = (data: unknown) => {
  const mockFetch = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(data),
    }),
  );
  global.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
};

describe("login", () => {
  beforeEach(() => {
    vi.resetModules();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    global.fetch = originalFetch;
  });

  test("does not request account data when the account navigation is missing", async () => {
    const mockFetch = mockAccountFetch({ publisher: null });

    await import("../login");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  test("shows authenticated account navigation from publisher data", async () => {
    const {
      notAuthenticatedMenu,
      authenticatedMenu,
      displayName,
      storesMenu,
      validationSetsMenu,
    } = createAccountNavigationFixture();
    const mockFetch = mockAccountFetch({
      publisher: {
        fullname: "Jane Developer",
        has_stores: true,
        has_validation_sets: true,
      },
    });

    await import("../login");

    await waitFor(() => {
      expect(displayName).toHaveTextContent("Jane Developer");
    });
    expect(mockFetch).toHaveBeenCalledWith("/account.json");
    expect(notAuthenticatedMenu).toHaveClass("u-hide");
    expect(authenticatedMenu).not.toHaveClass("u-hide");
    expect(storesMenu).not.toHaveClass("u-hide");
    expect(validationSetsMenu).not.toHaveClass("u-hide");
    expect(window.sessionStorage.getItem("displayName")).toBe("Jane Developer");
  });

  test("keeps optional authenticated menu links hidden when flags are false", async () => {
    const { displayName, storesMenu, validationSetsMenu } =
      createAccountNavigationFixture();
    mockAccountFetch({
      publisher: {
        fullname: "Jane Developer",
        has_stores: false,
        has_validation_sets: false,
      },
    });

    await import("../login");

    await waitFor(() => {
      expect(displayName).toHaveTextContent("Jane Developer");
    });
    expect(storesMenu).toHaveClass("u-hide");
    expect(validationSetsMenu).toHaveClass("u-hide");
  });

  test("shows unauthenticated navigation when publisher data is missing", async () => {
    const { notAuthenticatedMenu, authenticatedMenu } =
      createAccountNavigationFixture();
    mockAccountFetch({ publisher: null });

    await import("../login");

    await waitFor(() => {
      expect(notAuthenticatedMenu).not.toHaveClass("u-hide");
    });
    expect(authenticatedMenu).toHaveClass("u-hide");
  });

  test("shows unauthenticated navigation when account request fails", async () => {
    const { notAuthenticatedMenu, authenticatedMenu } =
      createAccountNavigationFixture();
    global.fetch = vi.fn(() =>
      Promise.reject(new Error("Request failed")),
    ) as unknown as typeof fetch;

    await import("../login");

    await waitFor(() => {
      expect(notAuthenticatedMenu).not.toHaveClass("u-hide");
    });
    expect(authenticatedMenu).toHaveClass("u-hide");
  });
});
