import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { store } from "../../../store";
import Navigation from "../Navigation";

const queryClient = new QueryClient();

jest.mock("react-query", () => ({
  ...jest.requireActual("react-query"),
  useQuery: jest.fn().mockReturnValue({
    data: {
      publisher: {
        email: "test@example.com",
        fullname: "John Doe",
        has_stores: true,
        indentity_url: "https://example.com",
        image: null,
        is_canonical: false,
        nickname: "johndoe",
      },
    },
    isLoading: false,
    isSuccess: true,
  }),
}));

const mockRouterReturnValue = { id: "test-id" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => mockRouterReturnValue,
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn().mockReturnValue([
    { id: "test-id", name: "Test store", roles: ["admin"] },
    {
      id: "non-admin-store",
      name: "Non-admin store",
      roles: ["review", "view", "access"],
    },
  ]),
}));

const renderComponent = (sectionName: string) => {
  render(
    <Provider store={store}>
      <RecoilRoot>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <Navigation sectionName={sectionName} />
          </QueryClientProvider>
        </BrowserRouter>
      </RecoilRoot>
    </Provider>,
  );
};

describe("Navigation", () => {
  test("displays logo", () => {
    renderComponent("snaps");
    expect(screen.getAllByRole("img", { name: "Snapcraft logo" })).toHaveLength(
      2,
    );
  });

  test("members link is visible if user has admin role", () => {
    mockRouterReturnValue.id = "test-id";
    renderComponent("snaps");
    expect(screen.getByRole("link", { name: /Members/ })).toBeInTheDocument();
  });

  test("members link is not visible if user does not have admin role", () => {
    mockRouterReturnValue.id = "non-admin-store";
    renderComponent("snaps");
    expect(
      screen.queryByRole("link", { name: /Members/ }),
    ).not.toBeInTheDocument();
  });

  test("settings link is visible if user has admin role", () => {
    mockRouterReturnValue.id = "test-id";
    renderComponent("snaps");
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
  });

  test("settings link is not visible if user does not have admin role", () => {
    mockRouterReturnValue.id = "non-admin-store";
    renderComponent("snaps");
    expect(
      screen.queryByRole("link", { name: /Settings/ }),
    ).not.toBeInTheDocument();
  });
});
