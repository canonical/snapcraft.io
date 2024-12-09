function selector(selector, name) {
  const dropDown = document.querySelector(selector);

  function onChange() {
    let params = new URLSearchParams(window.location.search);

    params.set(name, this.value);

    window.location.search = params.toString();
  }

  dropDown.addEventListener("change", onChange);
}

export { selector };
