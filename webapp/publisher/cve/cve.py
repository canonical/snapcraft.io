import json
from hashlib import sha1
from os import getenv
import requests

from webapp import api
from webapp.helpers import get_yaml_loader
from werkzeug.exceptions import Unauthorized, Forbidden, NotFound

REST_API_URL = "https://api.github.com"
GITHUB_SNAPCRAFT_BOT_USER_TOKEN = getenv("GITHUB_SNAPCRAFT_BOT_USER_TOKEN")

class Cve:
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
