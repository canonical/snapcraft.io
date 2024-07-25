import { screen, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { MutableSnapshot, RecoilRoot } from "recoil";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { useRecoilValue } from "recoil";
import { store } from "../../../store";
import AccountDetails from "../AccountDetails";
import { publisherState } from "../../../atoms";

const queryClient = new QueryClient();

const RecoilObserver = ({ node, event }: { node: any; event: Function }) => {
  const value = useRecoilValue(node);

  useEffect(() => {
    event(value);
  }, [event, value]);

  return null;
};

const renderComponent = ({ event, state }: { event: Function; state: any }) => {
  render(
    <RecoilRoot
      initializeState={(snapshot: MutableSnapshot) => {
        return snapshot.set(publisherState, {
          email: "john@testing.com",
          fullname: "John Doe",
          has_stores: true,
          identity_url: "https://example.com",
          image: null,
          is_canonical: false,
          nickname: "johndoe",
          subscriptions: {
            newsletter: false,
          },
        });
      }}
    >
      <BrowserRouter>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <RecoilObserver node={state} event={event} />
            <AccountDetails />
          </QueryClientProvider>
        </Provider>
      </BrowserRouter>
    </RecoilRoot>,
  );
};

describe("AccountDetails", () => {
  test("renders correct page", async () => {
    const onload = jest.fn();
    renderComponent({ event: onload, state: publisherState });
    const component = await waitFor(() => {
      return screen.getByRole("heading", { level: 2, name: "Account details" });
    });
    expect(component).toBeInTheDocument();
  });

  test("displays edit button", async () => {
    const onload = jest.fn();
    renderComponent({ event: onload, state: publisherState });
    const component = await waitFor(() => {
      return screen.getByRole("link", { name: /Edit details/ });
    });
    expect(component).toBeInTheDocument();
  });
});
