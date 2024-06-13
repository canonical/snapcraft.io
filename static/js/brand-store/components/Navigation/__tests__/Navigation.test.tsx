import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { store } from "../../../store";
import Navigation from "../Navigation";

const queryClient = new QueryClient();

const renderComponent = (sectionName: string) => {
  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Navigation sectionName={sectionName} />
      </QueryClientProvider>
    </Provider>
  );
};

describe("Navigation", () => {
  test("displays logo", () => {
    renderComponent("snaps");
    expect(screen.getAllByRole("img", { name: "Snapcraft logo" })).toHaveLength(
      2
    );
  });
});
