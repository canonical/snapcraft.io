import type { ComponentProps } from "react";
import { Link } from "react-router-dom";

import type { Button } from "@canonical/react-ds-global";

export type RouterLinkButtonProps = ComponentProps<typeof Link> &
  Pick<ComponentProps<typeof Button>, "importance" | "anticipation">;

function RouterLinkButton({
  importance = "primary",
  anticipation,
  className,
  children,
  ...props
}: RouterLinkButtonProps) {
  return (
    <Link
      {...props}
      className={["ds button", importance, anticipation, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="label">{children}</span>
    </Link>
  );
}

export default RouterLinkButton;
