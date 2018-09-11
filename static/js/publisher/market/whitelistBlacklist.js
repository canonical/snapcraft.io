function whitelistBlacklist(form) {
  const type = form['territories'].value;
  const whitelist = form['whitelist_countries'];
  const blacklist = form['blacklist_countries'];
  const customType = form['territories_custom_type'].value;


  if (type === 'all') {
    whitelist.setAttribute('value', '');
    blacklist.setAttribute('value', '');
  }

  if (type === 'custom') {
    if (customType === 'whitelist') {
      blacklist.setAttribute('value', '');
    } else if (customType === 'blacklist') {
      whitelist.setAttribute('value', '');
    }
  }
}

function transformWhitelistBlacklist(str) {
  if (str !== '') {
    return str.split(', ');
  } else {
    return [];
  }
}

export { whitelistBlacklist, transformWhitelistBlacklist };