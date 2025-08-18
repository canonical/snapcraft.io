import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.exceptions import StoreApiResourceNotFound, StoreApiError
from webapp.helpers import api_publisher_session

dashboard = Dashboard(api_publisher_session)


def can_user_access_cve_data(snap_name):
    """
    Check if the user has access to CVE data for the given snap.

    :return: A tuple containing:
        has_access (bool): True if the user has access, False otherwise.
        error_message (str): Error message if access is denied.
        status_code (int): HTTP status code for the response.
    """
    is_user_canonical = flask.session["publisher"].get("is_canonical", False)

    # TODO: in future with brand store support we will need more specific
    # checks, such as those implemented in CveHelper.can_user_access_cve_data
    # For now, we only check if user is Canonical member and has
    # publisher access to the snap.
    if not is_user_canonical:
        return (False, "User is not allowed to see snap's CVE data.", 403)

    try:
        snap_details = dashboard.get_snap_info(flask.session, snap_name)
    except StoreApiResourceNotFound:
        return (False, f"CVEs data for '{snap_name}' snap not found.", 404)
    except StoreApiError:
        return (False, f"Error fetching '{snap_name}' snap details.", 500)

    if not snap_details:
        return (False, f"CVEs data for '{snap_name}' snap not found.", 404)

    return (True, None, 200)
