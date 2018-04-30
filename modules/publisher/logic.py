def get_snaps_account_info(account_info):
    """Get snaps from the account information of a user

    :param account_info The account informations

    :return A list of snaps
    :return A list of registred snaps
    """
    user_snaps = {}
    registered_snaps = {}
    if '16' in account_info['snaps']:
        snaps = account_info['snaps']['16']
        for snap in snaps.keys():
            if not snaps[snap]['latest_revisions']:
                registered_snaps[snap] = snaps[snap]
            else:
                user_snaps[snap] = snaps[snap]

    return user_snaps, registered_snaps
