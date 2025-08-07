# Packages
import flask
import pycountry
from canonicalwebteam.store_api.dashboard import Dashboard

# Local
from webapp.helpers import api_publisher_session, launchpad
from webapp.decorators import login_required

dashboard = Dashboard(api_publisher_session)


@login_required
def get_settings_data(snap_name):
    snap_details = dashboard.get_snap_info(flask.session, snap_name)

    if "whitelist_country_codes" in snap_details:
        whitelist_country_codes = (
            snap_details["whitelist_country_codes"]
            if len(snap_details["whitelist_country_codes"]) > 0
            else []
        )
    else:
        whitelist_country_codes = []

    if "blacklist_country_codes" in snap_details:
        blacklist_country_codes = (
            snap_details["blacklist_country_codes"]
            if len(snap_details["blacklist_country_codes"]) > 0
            else []
        )
    else:
        blacklist_country_codes = []

    countries = []
    for country in pycountry.countries:
        countries.append({"key": country.alpha_2, "name": country.name})

    is_on_lp = False
    lp_snap = launchpad.get_snap_by_store_name(snap_name)
    if lp_snap:
        is_on_lp = True

    context = {
        "snap_name": snap_details["snap_name"],
        "snap_title": snap_details["title"],
        "snap_id": snap_details["snap_id"],
        "publisher_name": snap_details["publisher"]["display-name"],
        "license": snap_details["license"],
        "private": snap_details["private"],
        "unlisted": snap_details["unlisted"],
        "countries": countries,
        "whitelist_countries": whitelist_country_codes,
        "blacklist_countries": blacklist_country_codes,
        "store": snap_details["store"],
        "keywords": snap_details["keywords"],
        "status": snap_details["status"],
        "is_on_lp": is_on_lp,
        "update_metadata_on_release": snap_details[
            "update_metadata_on_release"
        ],
        "visibility_locked": bool(snap_details["visibility_locked"]),
    }

    return flask.jsonify({"success": True, "data": context})
