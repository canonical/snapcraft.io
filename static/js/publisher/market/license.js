function license(form) {
  const type = form['license-type'].value;
  form['license'].value = form[`license-${type}`].value;
}

export { license };