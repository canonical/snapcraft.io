function enableInput(type) {
  const blackListMultiselect = document.querySelector(
    ".js-blacklist .p-multiselect"
  );
  const blackListMultiselectInput = blackListMultiselect.querySelector(
    ".p-multiselect__input"
  );
  const whiteListMultiselect = document.querySelector(
    ".js-whitelist .p-multiselect"
  );
  const whiteListMultiselectInput = whiteListMultiselect.querySelector(
    ".p-multiselect__input"
  );

  if (type === "whitelist") {
    blackListMultiselect.classList.add("is-disabled");
    blackListMultiselectInput.setAttribute("disabled", "disabled");
    whiteListMultiselectInput.removeAttribute("disabled");
    whiteListMultiselect.classList.remove("is-disabled");
  } else if (type === "blacklist") {
    whiteListMultiselect.classList.add("is-disabled");
    whiteListMultiselectInput.setAttribute("disabled", "disabled");
    blackListMultiselectInput.removeAttribute("disabled");
    blackListMultiselect.classList.remove("is-disabled");
  }
}

function changeHandler(e) {
  const target = e.target;

  if (target.id === "territories_custom" || target.id === "territories_all") {
    const custom = document.getElementById("territories_custom");
    const checked = custom.checked;
    const nested = custom.parentNode.querySelector(".p-nested-inputs");

    if (checked) {
      nested.classList.remove("is-hidden");
    } else {
      nested.classList.add("is-hidden");
    }
  } else if (target.id === "territories_custom_whitelist" && target.checked) {
    enableInput("whitelist");
  } else if (target.id === "territories_custom_blacklist" && target.checked) {
    enableInput("blacklist");
  }
}

export { enableInput, changeHandler };
