import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@testing-library/jest-dom";

import ConfigureRemodelForm from "../ConfigureRemodelForm";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

vi.mock("react-query", async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: vi.fn(),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigureRemodelForm
          setShowErrorNotification={vi.fn()}
          setErrorMessage={vi.fn()}
          setShowNotification={vi.fn()}
          refetch={vi.fn()}
        />
      </QueryClientProvider>
    </BrowserRouter>,
  );
};

describe("ConfigureRemodelForm", () => {
  it("disables the 'Confirm' button by default", () => {
    // @ts-expect-error - Mocking useQuery to test form behavior with valid fields
    useQuery.mockReturnValue({
      data: [
        {
          name: "test-model-1",
        },
      ],
    });
    renderComponent();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("enables the 'Confirm' button if required fields have values", async () => {
    // @ts-expect-error - Mocking useQuery to test form behavior with valid fields
    useQuery.mockReturnValue({
      data: [
        {
          name: "test-model-1",
        },
      ],
    });
    renderComponent();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText("Select a target model"), [
      "test-model-1",
    ]);
    await user.type(screen.getByLabelText("Input devices to target"), "*");
    expect(screen.getByRole("button", { name: "Confirm" })).not.toHaveAttribute(
      "aria-disabled",
    );
  });
});
