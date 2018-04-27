const NAMES = {
  'public_metrics_territories': 'installed_base_by_country_percent',
  'public_metrics_distros': 'weekly_installed_base_by_operating_system_normalized'
};

function publicMetrics(form) {
  const publicMetricsEnabled = form['public_metrics_enabled'].checked;

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
