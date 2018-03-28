const NAMES = {
  'public_metrics_territories': 'installed_base_by_country_percent'
};

function publicMetrics(form, formData) {
  const publicMetricsEnabled = form['public_metrics_enabled'].checked;

  if (publicMetricsEnabled) {
    formData.set('public_metrics_enabled', publicMetricsEnabled);
  } else {
    formData.set('public_metrics_enabled', false);
  }

  let blackList = [];

  Object.keys(NAMES).forEach(name => {
    const checked = form[name].checked;

    if (!checked) {
      blackList.push(NAMES[name]);
    }

    if (!publicMetricsEnabled) {
      form[name].setAttribute('disabled', 'disabled');
    } else {
      form[name].removeAttribute('disabled');
    }
  });

  if (blackList.length > 0) {
    form['public_metrics_blacklist'].setAttribute('value', blackList.join(','));
  } else {
    form['public_metrics_blacklist'].removeAttribute('value');
  }
}

export { NAMES, publicMetrics };
