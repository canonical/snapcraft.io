import { useQuery, QueryClient, QueryClientProvider } from "react-query";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import PrimaryDomainInput from "../PrimaryDomainInput";

import { mockData } from "../../../test-utils";

import type { Data } from "../../../types";

window.DNS_VERIFICATION_TOKEN = "abc123";

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn(),
}));

const mockUseQueryReturnValue = {
  data: { primary_domain: true },
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

const renderComponent = (data: Data, defaultValues: { [key: string]: any }) => {
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
    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    renderComponent(mockData, { primary_website: "https://example.com" });
    expect(screen.getByText("Verified ownership")).toBeInTheDocument();
  });

  it("shows message if verified domain is changed", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;
    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://example.comabc");
    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockData, { primary_website: "https://example.com" });
    const input = screen.getByRole("textbox", { name: "Primary website:" });
    await user.type(input, "https://example.comabc");
    expect(input).toHaveValue("https://example.comabc");

    expect(
      screen.getByText(/Please save your changes to verify/),
    ).toBeInTheDocument();
  });

  it("doesn't show message if only verified domain path is changed", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;
    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://example.com");

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockData, { primary_website: "https://example.com" });
    const input = screen.getByRole("textbox", { name: "Primary website:" });
    await user.clear(input);
    await user.type(input, "/path");
    expect(screen.getByText("Verified ownership")).toBeInTheDocument();
  });

  it("shows message if verified domain is in no path list", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;

    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getValues = jest
      .fn()
      .mockReturnValue("https://launchpad.net/path");

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);
    const user = userEvent.setup();
    renderComponent(
      { ...mockData, primary_website: "https://launchpad.net" },
      { primary_website: "https://launchpad.net" }
    );
    await user.type(
      screen.getByRole("textbox", { name: "Primary website:" }),
      "/path",
    );
    expect(screen.getByText(/Unable to verify/)).toBeInTheDocument();
  });

  it("'Verified ownership' button opens modal with token", async () => {
    mockUseQueryReturnValue.data.primary_domain = true;

    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: false,
    });

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockData, { primary_website: "https://example.com" });
    await user.click(
      screen.getByRole("button", { name: "Verified ownership" }),
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

    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    renderComponent(mockData, { primary_website: "https://example.com" });
    expect(screen.queryByText("Verified ownership")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Verify ownership" }),
    ).toBeInTheDocument();
  });

  it("'Verify ownership' button opens modal with token", async () => {
    mockUseQueryReturnValue.data.primary_domain = false;

    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: false,
    });

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockData, { primary_website: "https://example.com" });
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

    // @ts-ignore
    useQuery.mockImplementation(() => mockUseQueryReturnValue);

    mockUseFormReturnValue.getFieldState = jest.fn().mockReturnValue({
      invalid: false,
      isDirty: true,
    });

    // @ts-ignore
    useForm.mockImplementation(() => mockUseFormReturnValue);

    const user = userEvent.setup();
    renderComponent(mockData, { primary_website: "https://example.com" });
    expect(
      screen.getByRole("button", { name: "Verify ownership" }),
    ).toBeDisabled();
  });
});
