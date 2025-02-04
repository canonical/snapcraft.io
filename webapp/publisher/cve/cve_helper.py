import json
from os import getenv
import requests
import flask

from werkzeug.exceptions import NotFound

from canonicalwebteam.store_api.stores.snapstore import SnapPublisher

from webapp.publisher.snaps import (
    logic,
)

from webapp.helpers import api_publisher_session

publisher_api = SnapPublisher(api_publisher_session)

REST_API_URL = "https://api.github.com"
GITHUB_SNAPCRAFT_BOT_USER_TOKEN = getenv("GITHUB_SNAPCRAFT_BOT_USER_TOKEN")

class CveHelper:
    """
    Provides CVE data through GitHub by using snapcraft-web@canonical.com.
    """

    def _get_cve_file_metadata(self, file_path):
        url = f"{REST_API_URL}/repos/canonical/canonicalwebteam.snap-cves/contents/{file_path}?ref=main"
        headers = {"Authorization": f"token {GITHUB_SNAPCRAFT_BOT_USER_TOKEN}"}
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise NotFound
        
    def _format_cve_response(self, cve_list, cve_details, usn_details):
        cves = []
        for cve_id in cve_list:
            cve_detail = cve_details[cve_id]
            cve = cve_list[cve_id]

            cve_usns = []
            cve_usn_list = cve["usns"]
            if cve_usn_list:
                for usn_id in cve_usn_list:
                    usn_detail = usn_details[usn_id]
                    if usn_detail:
                        cve_usns.append({
                            "id": usn_id,
                            "description": usn_detail["description"],
                            "published_at": usn_detail["published_at"],
                            "related_launchpad_bugs": usn_detail["related_launchpad_bugs"],
                        })

            cves.append({
                "id": cve_id,
                "cvss_score": cve_detail["cvss_score"],
                "cvss_severity": cve_detail["cvss_severity"],
                "description": cve_detail["description"],
                "ubuntu_priority": cve_detail["ubuntu_priority"],
                "affected_binaries": cve["affected_binaries"],
                "channels_with_fix": cve["channels_with_fix"],
                "usns": cve_usns
            })

        return cves

    def _fetch_file_content(self, snap_name, revision, file_metadata):
        if "download_url" in file_metadata:
            download_url = file_metadata["download_url"]
            headers = {"Authorization": f"token {GITHUB_SNAPCRAFT_BOT_USER_TOKEN}"}
            response = requests.get(download_url, headers=headers)

            if response.status_code == 200:
                content = json.loads(response.text)

                cve_list = content["snaps"][snap_name]["revisions"][revision]

                fixed_cves = cve_list['fixed-cves']
                unfixed_cves = cve_list['unfixed-cves']

                cve_details = content['security_issues']['cves']
                usn_details = content['security_issues']['usns']

                unfixed = self._format_cve_response(unfixed_cves, cve_details, usn_details)
                fixed = self._format_cve_response(fixed_cves, cve_details, usn_details)

                cves = fixed + unfixed

                return cves
            else:
                raise NotFound
        else:
            raise NotFound

    def get_cve_with_revision(self, snap_name, revision):
        file_metadata = self._get_cve_file_metadata("snap-cves/{}.json".format(snap_name))

        if file_metadata:
            return self._fetch_file_content(snap_name, revision, file_metadata)
        return None
    
    def can_user_access_cve_data(self, snap_name):
        snap_details = publisher_api.get_snap_info(snap_name, flask.session)
        snap_store = snap_details['store']
        snap_publisher = snap_details['publisher']

        account_info = publisher_api.get_account(flask.session)

        admin_user_stores = logic.get_stores(
            account_info["stores"], roles=["admin"]
        )
        is_user_admin = [item for item in admin_user_stores if item["name"] == snap_store] 

        GLOBAL_STORE= "Global"
        is_snap_in_global_store = snap_store == GLOBAL_STORE

        # check if the snap is publised by canonical
        CANONICAL_PUBLISHER_ID = 'canonical'
        is_snap_publisher_canonical = snap_publisher["id"] == CANONICAL_PUBLISHER_ID

        # check if the user is the publisher
        is_user_snap_publisher = snap_publisher["username"] == account_info["username"]

        # check if user canonical
        is_user_canonical = flask.session["publisher"].get(
            "is_canonical", False
        )
        is_user_collaborator = snap_name in account_info["snaps"]["16"] 

        can_view_cves = False
        if is_user_snap_publisher or is_user_admin:
            can_view_cves = True
        elif is_snap_in_global_store:
            if is_snap_publisher_canonical:
                if is_user_canonical or is_user_collaborator:
                    can_view_cves = True
            elif is_user_collaborator:
                can_view_cves = True

        return can_view_cves
