import {
  render,
  screen,
  act,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import { importComponent } from "../importComponent";

function renderComponent() {
  const sleep = (n: number) => new Promise<void>((r) => setTimeout(r, n));

  function MockComponent() {
    return <h1>Mock Component!</h1>;
  }

  const LazyComponent = importComponent(async () => {
    await sleep(100);

    return {
      default: MockComponent,
    };
  });

  return render(<LazyComponent />);
}

describe("importComponent", () => {
  test("renders loader", () => {
    act(() => {
      renderComponent();
    });

    expect(screen.getByText(/Loading/)).toBeInTheDocument();
  });

  test("renders component", async () => {
    await act(async () => {
      renderComponent();
    });

    await waitForElementToBeRemoved(() => screen.getByText(/Loading/));

    expect(screen.getByText(/Mock Component!/)).toBeInTheDocument();
  });
});
