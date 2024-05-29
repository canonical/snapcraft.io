import * as reactRedux from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { RecoilRoot } from "recoil";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "react-query";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Settings from "./Settings";
import { store } from "../../store";
import { RootState } from "./Settings";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn().mockReturnValue({ id: "test-id" }),
}));

jest.mock("react-redux", () => ({
  ...jest.requireActual("react-redux"),
  useSelector: jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function renderComponent() {
  return render(
    <Provider store={store}>
      <RecoilRoot>
        <Router>
          <QueryClientProvider client={queryClient}>
            <Settings />
          </QueryClientProvider>
        </Router>
      </RecoilRoot>
    </Provider>
  );
}

function getInitialState(): RootState {
  return {
    currentStore: {
      currentStore: {
        id: "test-id",
        private: true,
        "manual-review-policy": "allow",
        name: "test-store",
      },
      loading: false,
      notFound: false,
    },
    members: {
      members: [
        {
          id: "testid",
          current_user: true,
          roles: ["admin"],
        },
      ],
      loading: false,
      notFound: false,
    },
    brandStores: {
      brandStoresList: [],
      loading: false,
      notFound: false,
    },
  };
}

let initialState: RootState = getInitialState();

const mockSelector = jest.spyOn(reactRedux, "useSelector");
const setupMockSelector = (state: RootState) => {
  mockSelector.mockImplementation((callback: any) => {
    return callback(state);
  });
};

beforeEach(() => {
  initialState = getInitialState();
});

test("the 'is public' checkbox should not be checked when the current store is set to private", () => {
  setupMockSelector(initialState);
  renderComponent();
  expect(
    screen.getByLabelText("Include this store in public lists")
  ).not.toBeChecked();
});

test("the 'is public' checkbox should be checked when the current store is not set to private", () => {
  initialState.currentStore.currentStore.private = false;
  setupMockSelector(initialState);
  renderComponent();
  expect(
    screen.getByLabelText("Include this store in public lists")
  ).toBeChecked();
});

test("the correct value is given to the store ID field", () => {
  setupMockSelector(initialState);
  renderComponent();
  const storeIdInput = screen.getByLabelText("Store ID") as HTMLInputElement;
  expect(storeIdInput.value).toEqual(initialState.currentStore.currentStore.id);
});

test("the correct radio button is checked by default for manual review policy", () => {
  setupMockSelector(initialState);
  renderComponent();
  const checkedRadioButton = screen.getByRole("radio", {
    checked: true,
  }) as HTMLInputElement;
  expect(checkedRadioButton.value).toEqual(
    initialState.currentStore.currentStore["manual-review-policy"]
  );
});

test("the save button is disabled by default", () => {
  setupMockSelector(initialState);
  renderComponent();
  expect(screen.getByText("Save changes")).toBeDisabled();
});

test("the save button is enabled when the data changes", () => {
  setupMockSelector(initialState);
  renderComponent();
  screen.getByRole("checkbox").click();
  expect(screen.getByText("Save changes")).not.toBeDisabled();
});
