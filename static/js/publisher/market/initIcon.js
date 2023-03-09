import React from "react";
import { createRoot } from "react-dom/client";
import Icon from "../form/icon";

import { ICON_RESTRICTIONS } from "../market/restrictions";

function initIcon(holder, icon, title, updateIcon) {
  const container = document.querySelector(holder);

  if (!container) {
    throw new Error(`${holder} does not exist.`);
  }

  const root = createRoot(container);
  root.render(
    <Icon
      icon={icon}
      title={title}
      updateIcon={updateIcon}
      restrictions={ICON_RESTRICTIONS}
    />
  );
}

export { initIcon };
