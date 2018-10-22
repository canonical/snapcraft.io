function whitelistBlacklist(form) {
  const type = form["territories"].value;
  const whitelist = form["whitelist_countries"];
  const blacklist = form["blacklist_countries"];
  const customType = form["territories_custom_type"].value;

  if (type === "all") {
    whitelist.value = "";
    blacklist.value = "";
  }

  if (type === "custom") {
    if (customType === "whitelist") {
      blacklist.value = "";
    } else if (customType === "blacklist") {
      whitelist.value = "";
    }
  }
}

export { whitelistBlacklist };
