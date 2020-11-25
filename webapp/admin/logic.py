def get_admin_stores(account_info):
    """Return a list a stores where the user is an admin

    :param account_info: The account information

    :return: A list of stores
    """
    stores = account_info.get("stores", [])
    admin_stores = []
    for store in stores:
        if "admin" in store["roles"]:
            admin_stores.append(store)

    return admin_stores
