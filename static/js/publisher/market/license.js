function license(form) {
  const type = form['license-type'].value;
  form['license'].value = form[`license-${type}`].value;
}

function initLicenses(inputs) {
  function licenseTypeChange() {
    var type = this.value;
    inputs.forEach(item => {
      if (item.id.includes(type)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  }

  var licenseRadio = document.querySelectorAll('[name="license-type"]');
  if (licenseRadio) {
    for (var i = 0; i < licenseRadio.length; i++) {
      licenseRadio[i].addEventListener('change', licenseTypeChange);
    }
  }
}

export { license, initLicenses };