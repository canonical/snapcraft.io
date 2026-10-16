import { createRef } from "react";
import { Button } from "@canonical/react-ds-global";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import "@testing-library/jest-dom";

import RouterLinkButton, {
  type RouterLinkButtonProps,
} from "../RouterLinkButton";

function Destination() {
  const location = useLocation();
  return <p>Destination: {location.state?.message}</p>;
}

function renderComponent(props: Partial<RouterLinkButtonProps> = {}) {
  return render(
    <MemoryRouter>
      <RouterLinkButton to="/destination" {...props}>
        Continue
      </RouterLinkButton>
      <Routes>
        <Route path="/" element={<p>Start</p>} />
        <Route path="/destination" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RouterLinkButton", () => {
  it.each([
    {},
    { importance: "secondary", anticipation: "constructive" },
    { importance: "tertiary", anticipation: "caution" },
    { importance: "primary", anticipation: "destructive" },
  ] satisfies Partial<RouterLinkButtonProps>[])(
    "matches Button classes and label markup for %j",
    (props) => {
      renderComponent(props);
      render(<Button {...props}>Reference</Button>);

      const link = screen.getByRole("link", { name: "Continue" });
      const button = screen.getByRole("button", { name: "Reference" });
      expect(link.className).toBe(button.className);
      expect(link.querySelector(".label")).toHaveTextContent("Continue");
      expect(link).not.toHaveAttribute("importance");
      expect(link).not.toHaveAttribute("anticipation");
    },
  );

  it("preserves Link props, custom classes and the anchor ref", () => {
    const ref = createRef<HTMLAnchorElement>();
    renderComponent({
      ref,
      to: { pathname: "/destination", search: "?page=2", hash: "#details" },
      className: "custom",
      target: "_blank",
      rel: "noreferrer",
      style: { marginLeft: "1rem" },
      tabIndex: 2,
      "aria-label": "Go to destination",
    });

    const link = screen.getByRole("link", { name: "Go to destination" });
    expect(ref.current).toBe(link);
    expect(link).toHaveClass("custom");
    expect(link).toHaveAttribute("href", "/destination?page=2#details");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(link).toHaveAttribute("tabindex", "2");
    expect(link).toHaveStyle({ marginLeft: "1rem" });
  });

  it("navigates with router state and invokes enabled click handlers", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onClickCapture = vi.fn();
    renderComponent({
      onClick,
      onClickCapture,
      state: { message: "arrived" },
      replace: true,
    });

    await user.click(screen.getByRole("link", { name: "Continue" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClickCapture).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Destination: arrived")).toBeInTheDocument();
  });

  it("honors a click handler that prevents navigation", async () => {
    const user = userEvent.setup();
    renderComponent({ onClick: (event) => event.preventDefault() });

    await user.click(screen.getByRole("link", { name: "Continue" }));

    expect(screen.getByText("Start")).toBeInTheDocument();
  });

  it("supports keyboard navigation when enabled", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.tab();
    expect(screen.getByRole("link", { name: "Continue" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(screen.getByText("Destination:")).toBeInTheDocument();
  });

  it("preserves enabled auxiliary click handlers", () => {
    const onAuxClickCapture = vi.fn();
    renderComponent({ onAuxClickCapture });

    fireEvent(
      screen.getByRole("link", { name: "Continue" }),
      new MouseEvent("auxclick", { bubbles: true, button: 1 }),
    );

    expect(onAuxClickCapture).toHaveBeenCalledTimes(1);
  });
});
