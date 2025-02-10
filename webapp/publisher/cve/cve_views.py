import flask
from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from webapp.helpers import api_publisher_session
from webapp.decorators import login_required
from webapp.publisher.cve.cve_helper import CveHelper

publisher_api = SnapPublisher(api_publisher_session)


@login_required
def get_cves(snap_name, revision):

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

    cve = CveHelper()
    can_view_cves = cve.can_user_access_cve_data(snap_name=snap_name)
    if not can_view_cves:
        return (
            flask.jsonify(
                {
                    "success": False,
                    "error": "User is not allowed to see snap's CVE data.",
                }
            ),
            403,
        )

    cves = cve.get_cve_with_revision(snap_name, revision)
    cves = cve.filter_cve_data(
        cves,
        usn_ids,
        binary_statuses,
        binary_versions,
        binary_fixed_versions,
        binary_names,
        cvss_severities,
        ubuntu_priorities,
    )
    cves = cve.sort_cve_data(cves=cves, order=order, sort_by=sort_by)
    cves = cve.paginate_cve_list(cves=cves, page=page, page_size=page_size)

    return flask.jsonify({"success": True, **cves})
