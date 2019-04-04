import React from "react";
import ReactDOM from "react-dom";
import Icon from "../form/icon";

import { ICON_RESTRICTIONS } from "../market/restrictions";

function initIcon(holder, icon, title, updateIcon) {
  const holderEl = document.querySelector(holder);

  if (!holderEl) {
    throw new Error(`${holder} does not exist.`);
  }

  ReactDOM.render(
    <Icon
      icon={icon}
      title={title}
      updateIcon={updateIcon}
      restrictions={ICON_RESTRICTIONS}
    />,
    holderEl
  );
}

export { initIcon };
