import flask
from canonicalwebteam.store_api.dashboard import Dashboard
from canonicalwebteam.exceptions import StoreApiResourceNotFound, StoreApiError
from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.publisher.cve.cve_helper import CveHelper

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


@login_required
def get_revisions_with_cves(snap_name):

    # Check if the user has access to CVE data for the given snap
    has_access, error_message, status_code = can_user_access_cve_data(
        snap_name
    )
    if not has_access:
        return (
            flask.jsonify({"success": False, "message": error_message}),
            status_code,
        )

    revisions_with_cves = CveHelper.get_revisions_with_cves(snap_name)
    if len(revisions_with_cves) > 0:
        return flask.jsonify(
            {"success": True, "data": {"revisions": revisions_with_cves}}
        )
    else:
        return (
            flask.jsonify(
                {
                    "success": False,
                    "message": f"CVEs data for '{snap_name}' snap not found.",
                }
            ),
            404,
        )


@login_required
def get_cves(snap_name, revision):
    # Check if the user has access to CVE data for the given snap
    has_access, error_message, status_code = can_user_access_cve_data(
        snap_name
    )
    if not has_access:
        return (
            flask.jsonify({"success": False, "error": error_message}),
            status_code,
        )

    # Filtering params
    usn_ids = flask.request.args.getlist("usn_id")
    binary_statuses = flask.request.args.getlist("binary_status")
    binary_versions = flask.request.args.getlist("binary_version")
    binary_fixed_versions = flask.request.args.getlist("binary_fixed_version")
    binary_names = flask.request.args.getlist("binary_name")
    cvss_severities = flask.request.args.getlist("cvss_severity")
    ubuntu_priorities = flask.request.args.getlist("ubuntu_priority")

    # Sort params
    sort_by = flask.request.args.get("sort_by", default="id")
    order = flask.request.args.get("order", default="desc")

    allowed_fields_for_sort = [
        "id",
        "cvss_severity",
        "cvss_score",
        "ubuntu_priority",
    ]
    if sort_by and sort_by not in allowed_fields_for_sort:
        return (
            flask.jsonify(
                {
                    "success": False,
                    "error": (
                        "Data can only be sorted by id, "
                        "cvss_severity, cvss_score, ubuntu_priority"
                    ),
                }
            ),
            400,
        )

    allowed_order_params = ["asc", "desc"]
    if order and order not in allowed_order_params:
        return (
            flask.jsonify(
                {
                    "success": False,
                    "error": "'order' param can only be 'asc' or 'desc'",
                }
            ),
            400,
        )

    # Pagination params
    page = flask.request.args.get("page", default=1, type=int)
    page_size = flask.request.args.get("page_size", default=10, type=int)

    cves = CveHelper.get_cve_with_revision(snap_name, revision)
    cves = CveHelper.filter_cve_data(
        cves,
        usn_ids,
        binary_statuses,
        binary_versions,
        binary_fixed_versions,
        binary_names,
        cvss_severities,
        ubuntu_priorities,
    )
    cves = CveHelper.sort_cve_data(cves=cves, order=order, sort_by=sort_by)
    cves = CveHelper.paginate_cve_list(
        cves=cves, page=page, page_size=page_size
    )

    return flask.jsonify({"success": True, **cves})
