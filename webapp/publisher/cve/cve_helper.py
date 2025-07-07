import json
from os import getenv
import requests
import re

from werkzeug.exceptions import NotFound

from webapp.publisher.snaps import (
    logic,
)

REST_API_URL = "https://api.github.com"
GITHUB_SNAPCRAFT_BOT_USER_TOKEN = getenv("GITHUB_SNAPCRAFT_BOT_USER_TOKEN")
GLOBAL_STORE = "Global"
CANONICAL_PUBLISHER_ID = "canonical"


class CveHelper:
    """
    Provides CVE data through GitHub by using snapcraft-web@canonical.com.
    """

    @staticmethod
    def _get_cve_file_metadata(file_path):
        url = (
            f"{REST_API_URL}/repos/canonical/canonicalwebteam.snap-cves/"
            f"contents/{file_path}?ref=main"
        )
        headers = {"Authorization": f"token {GITHUB_SNAPCRAFT_BOT_USER_TOKEN}"}
        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise NotFound

    @staticmethod
    def _format_cve_response(cve_list, cve_details, usn_details, status):
        cves = []

        for cve_id, cve in cve_list.items():
            cve_detail = cve_details[cve_id]

            cve_usns = []
            cve_usn_list = cve["usns"]
            if cve_usn_list:
                for usn_id in cve_usn_list:
                    usn_detail = usn_details[usn_id]
                    if usn_detail:
                        cve_usns.append(
                            {
                                "id": usn_id,
                                "description": usn_detail["description"],
                                "published_at": usn_detail["published_at"],
                                "related_launchpad_bugs": usn_detail[
                                    "related_launchpad_bugs"
                                ],
                            }
                        )

            cves.append(
                {
                    "id": cve_id,
                    "status": status,
                    "cvss_score": cve_detail["cvss_score"],
                    "cvss_severity": cve_detail["cvss_severity"],
                    "description": cve_detail["description"],
                    "ubuntu_priority": cve_detail["ubuntu_priority"],
                    "affected_binaries": cve["affected_binaries"],
                    "channels_with_fix": cve["channels_with_fix"],
                    "usns": cve_usns,
                }
            )

        return cves

    @staticmethod
    def _fetch_file_content(snap_name, revision, file_metadata):
        if "download_url" in file_metadata:
            download_url = file_metadata["download_url"]
            headers = {
                "Authorization": f"token {GITHUB_SNAPCRAFT_BOT_USER_TOKEN}"
            }
            response = requests.get(download_url, headers=headers)

            if response.status_code == 200:
                content = json.loads(response.text)
                revisions = content["snaps"][snap_name]["revisions"]

                if revision not in revisions:
                    raise NotFound

                cve_list = revisions[revision]

                fixed_cves = cve_list["fixed-cves"]
                unfixed_cves = cve_list["unfixed-cves"]

                cve_details = content["security_issues"]["cves"]
                usn_details = content["security_issues"]["usns"]

                unfixed = CveHelper._format_cve_response(
                    unfixed_cves, cve_details, usn_details, "unfixed"
                )
                fixed = CveHelper._format_cve_response(
                    fixed_cves, cve_details, usn_details, "fixed"
                )

                return fixed + unfixed
            else:
                raise NotFound
        else:
            raise NotFound

    @staticmethod
    def get_revisions_with_cves(snap_name):
        try:
            contents = CveHelper._get_cve_file_metadata(
                f"snap-cves/{snap_name}"
            )

            # find all revision YAML files in the folder
            # e.g., 123.yaml, 456.yaml, 789.yaml
            # and extract the revision numbers
            revision_files = [
                int(match.group(1))
                for item in contents
                if (match := re.match(r"(\d+)\.yaml$", item["name"]))
            ]

            return revision_files
        except NotFound:
            return []

    @staticmethod
    def get_cve_with_revision(snap_name, revision):
        file_metadata = CveHelper._get_cve_file_metadata(
            "snap-cves/{}.json".format(snap_name)
        )

        if file_metadata:
            return CveHelper._fetch_file_content(
                snap_name, revision, file_metadata
            )
        return []

    @staticmethod
    def can_user_access_cve_data(
        snap_name, snap_details, account_info, is_user_canonical
    ):
        snap_store = snap_details["store"]
        snap_publisher = snap_details["publisher"]

        admin_user_stores = logic.get_stores(
            account_info["stores"], roles=["admin"]
        )
        is_user_admin = [
            item for item in admin_user_stores if item["name"] == snap_store
        ]

        is_snap_in_global_store = snap_store == GLOBAL_STORE

        is_snap_publisher_canonical = (
            snap_publisher["id"] == CANONICAL_PUBLISHER_ID
        )

        is_user_snap_publisher = (
            snap_publisher["username"] == account_info["username"]
        )

        is_user_collaborator = snap_name in account_info["snaps"]["16"]

        is_privileged_user = is_user_snap_publisher or is_user_admin
        is_user_canonical_publisher = (
            is_snap_publisher_canonical and is_user_canonical
        )
        has_store_access = is_snap_in_global_store and (
            is_user_collaborator or is_user_canonical_publisher
        )

        # To access the CVE data of a snap, a user must meet
        # the following criteria:
        # - For all stores, the user must be
        #   the publisher of the snap or have admin privileges.
        # - For non-Canonical snaps published
        #   in the global store, the user must be a collaborator.
        # - For Canonical snaps published
        #   in the global store, the user must be a Canonical publisher.
        can_view_cves = is_privileged_user or has_store_access

        return can_view_cves

    @staticmethod
    def _match_filters(
        cve,
        usn_ids,
        binary_statuses,
        binary_versions,
        binary_fixed_versions,
        binary_names,
        cvss_severities,
        ubuntu_priorities,
    ):
        if usn_ids:
            if not cve.get("usns") or not any(
                usn["id"] in usn_ids for usn in cve["usns"]
            ):
                return False

        if cvss_severities and cve["cvss_severity"] not in cvss_severities:
            return False

        if (
            ubuntu_priorities
            and cve["ubuntu_priority"] not in ubuntu_priorities
        ):
            return False

        if any(
            [
                binary_statuses,
                binary_fixed_versions,
                binary_versions,
                binary_names,
            ]
        ):
            if not cve.get("affected_binaries"):
                return False

            # Check if at least one affected binary matches the filters
            for binary in cve["affected_binaries"]:
                matches_binary = (
                    (
                        not binary_statuses
                        or binary["status"] in binary_statuses
                    )
                    and (
                        not binary_versions
                        or binary["version"] in binary_versions
                    )
                    and (
                        not binary_fixed_versions
                        or binary["fixed_version"] in binary_fixed_versions
                    )
                    and (not binary_names or binary["name"] in binary_names)
                )
                if matches_binary:
                    return True
            return False
        return True

    @staticmethod
    def filter_cve_data(
        cves,
        usn_ids,
        binary_statuses,
        binary_versions,
        binary_fixed_versions,
        binary_names,
        cvss_severities,
        ubuntu_priorities,
    ):
        return [
            cve
            for cve in cves
            if CveHelper._match_filters(
                cve,
                usn_ids=usn_ids,
                binary_fixed_versions=binary_fixed_versions,
                binary_names=binary_names,
                binary_statuses=binary_statuses,
                binary_versions=binary_versions,
                cvss_severities=cvss_severities,
                ubuntu_priorities=ubuntu_priorities,
            )
        ]

    @staticmethod
    def sort_cve_data(cves, sort_by, order):
        priority_order = {
            "negligible": 0,
            "low": 1,
            "medium": 2,
            "high": 3,
            "critical": 4,
        }

        is_reverse_order = order.lower() == "desc"

        if sort_by == "cvss_severity":
            cves.sort(
                key=lambda cve: priority_order.get(
                    cve.get("cvss_severity"), -1
                ),
                reverse=is_reverse_order,
            )

        elif sort_by == "ubuntu_priority":
            cves.sort(
                key=lambda cve: priority_order.get(
                    cve.get("ubuntu_priority"), -1
                ),
                reverse=is_reverse_order,
            )
        elif sort_by == "cvss_score":
            cves.sort(
                key=lambda cve: cve.get("cvss_score", 0),
                reverse=is_reverse_order,
            )
        else:
            cves.sort(
                key=lambda cve: cve.get(sort_by, ""), reverse=is_reverse_order
            )
        return cves

    @staticmethod
    def paginate_cve_list(cves, page, page_size):
        total_items = len(cves)
        start = (page - 1) * page_size
        end = start + page_size

        return {
            "page": page,
            "page_size": page_size,
            "total_items": total_items,
            "total_pages": (total_items + page_size - 1) // page_size,
            "data": cves[start:end],
        }
