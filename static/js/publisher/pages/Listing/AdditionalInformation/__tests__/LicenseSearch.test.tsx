import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { mockListingData } from "../../../../test-utils";
import LicenseInputs from "../LicenseInputs";
import { FieldValues, useForm } from "react-hook-form";
import { getDefaultListingData } from "../../../../utils";

function TestLicenseSearch() {
  const { register, setValue, watch } = useForm<FieldValues>({
    defaultValues: getDefaultListingData(mockListingData),
  });

  return (
    <form>
      <LicenseInputs
        listingData={mockListingData}
        register={register}
        setValue={setValue}
        watch={watch}
      />
    </form>
  );
}

function renderComponent() {
  return render(<TestLicenseSearch />);
}

const server = setupServer();

beforeAll(() => {
  server.listen();
});

beforeEach(() => {
  server.use(
    http.get("/api/test_id/verify", () => {
      return HttpResponse.json({
        primary_domain: true,
        token: "test-dns-verification-token",
      });
    }),
  );
});

afterEach(() => {
  jest.clearAllMocks();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("LicenseSearch", () => {
  test("the search field displays the currently selected license", () => {
    renderComponent();
    expect(screen.getByText("testing-license")).toBeVisible();
  });

  test("click on search field opens list of licenses", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(
      document.getElementsByClassName("p-multiselect__input").item(0)!,
    );

    await waitFor(() => {
      const suggestionsElem = document.getElementsByClassName(
        "p-list",
      )[0]! as HTMLUListElement;
      expect(suggestionsElem).toBeVisible();
      for (const child of suggestionsElem.children) {
        const text = child.textContent;
        // the current license should be filtered and not displayed in the dropdown
        expect(text).not.toEqual("testing-license");
      }
    });
  });

  test("removing focus from search field closes the licenses list", async () => {
    const { container } = renderComponent();
    const user = userEvent.setup();
    await user.click(
      document.getElementsByClassName("p-multiselect__input").item(0)!,
    );

    expect(await screen.findByText("random-license")).toBeVisible();
    await user.click(container);
    const randomLicense = screen.queryByText("random-license");
    expect(randomLicense).toBeNull();
  });

  test("remove license from list", async () => {
    renderComponent();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button"));

    const removedElem = screen.queryByText(/testing-license/);
    expect(removedElem).toBeNull();
  });
});
