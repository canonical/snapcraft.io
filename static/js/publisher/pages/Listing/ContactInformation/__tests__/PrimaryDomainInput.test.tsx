import { useQuery, QueryClient, QueryClientProvider } from "react-query";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import PrimaryDomainInput from "../PrimaryDomainInput";

import { mockListingData } from "../../../../test-utils";

import type { ListingData } from "../../../../types";

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

const mockUseQueryReturnValue = {
  data: { primary_domain: true, token: "abc123" },
  isLoading: false,
  status: "success",
};

jest.mock("react-hook-form", () => ({
  ...jest.requireActual("react-hook-form"),
  useForm: jest.fn(),
}));

const mockUseFormReturnValue = {
  register: jest.fn(),
  getFieldState: jest.fn().mockReturnValue({
    invalid: false,
    isDirty: false,
  }),
  getValues: jest.fn().mockReturnValue("https://example.com"),
};

const renderComponent = (
  data: ListingData,
  defaultValues: { [key: string]: unknown },
) => {
  const Component = () => {
    const { register, getFieldState, getValues } = useForm({
      defaultValues,
      mode: "onChange",
    });

    const queryClient = new QueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        <PrimaryDomainInput
          register={register}
          getFieldState={getFieldState}
          getValues={getValues}
          data={data}
        />
      </QueryClientProvider>
    );
  };

  return render(<Component />);
};

describe("PrimaryDomainInput", () => {
  it("shows as verified if domain is verified", () => {
    mockUseQueryReturnValue.data.primary_domain = true;
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    expect(screen.getByText("Ownership verified")).toBeInTheDocument();
  });

  it("shows message if verified domain is changed", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://example.comabc");
    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    const input = screen.getByRole("textbox", { name: "Primary website:" });
    await user.type(input, "abc");
    expect(input).toHaveValue("https://example.comabc");

    expect(
      screen.getByText(/Please save your changes to verify/),
    ).toBeInTheDocument();
  });

  it("doesn't show message if only verified domain path is changed", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;
    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://example.com");

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    const input = screen.getByRole("textbox", { name: "Primary website:" });
    await user.clear(input);
    await user.type(input, "/path");
    expect(screen.getByText("Ownership verified")).toBeInTheDocument();
  });

  it("shows message if verified domain is in no path list", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;

    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://launchpad.net/path");

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);
    const user = userEvent.setup();
    renderComponent(
      { ...mockListingData, primary_website: "https://launchpad.net" },
      { primary_website: "https://launchpad.net" },
    );
    await user.type(
      screen.getByRole("textbox", { name: "Primary website:" }),
      "/path",
    );
    expect(screen.getByText(/Unable to verify/)).toBeInTheDocument();
  });

  it("'Ownership verified' button opens modal with token", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;

    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: false,
    });

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    await user.click(
      screen.getByRole("button", { name: "Ownership verified" }),
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "Verify ownership" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "DNS verification token" }),
    ).toHaveValue("SNAPCRAFT_IO_VERIFICATION=abc123");
  });

  it("shows 'Verify ownership' button if not verified", () => {
    mockUseQueryReturnValue.data.primary_domain = false;

    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    expect(screen.queryByText("Ownership verified")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify ownership" }),
    ).toBeInTheDocument();
  });

  it("'Verify ownership' button opens modal with token", async () => {
    mockUseQueryReturnValue.data.primary_domain = false;

    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: false,
    });

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    await user.click(screen.getByRole("button", { name: "Verify ownership" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Verify ownership" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "DNS verification token" }),
    ).toHaveValue("SNAPCRAFT_IO_VERIFICATION=abc123");
  });

  it("'Verify ownership' button is disabled if field is dirty", async () => {
    mockUseQueryReturnValue.data.primary_domain = false;

    // @ts-expect-error mocks
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    // @ts-expect-error mocks
    useForm.mockImplementation(() => mockUseFormReturnValue);

    renderComponent(mockListingData, {
      primary_website: "https://example.com",
    });
    expect(
      screen.getByRole("button", { name: "Verify ownership" }),
    ).toBeDisabled();
  });
});
