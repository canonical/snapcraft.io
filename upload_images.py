import argparse
import hashlib
import json
import requests
from pymacaroons import Macaroon


def get_hash(filename):
    h = hashlib.sha256()
    with open(filename, "rb", buffering=0) as f:
        for b in iter(lambda: f.read(128 * 1024), b""):
            h.update(b)
    return h.hexdigest()


def get_authorization_header(root, discharge):
    """
    Bind root and discharge macaroons and return the authorization header.
    """

    bound = Macaroon.deserialize(root).prepare_for_request(
        Macaroon.deserialize(discharge)
    )

    return "Macaroon root={}, discharge={}".format(root, bound.serialize())


def main():
    parser = argparse.ArgumentParser(description=" Update images ...")
    parser.add_argument("snap_name")
    parser.add_argument(
        "action", choices=["change", "view", "download", "upload", "remove"]
    )
    parser.add_argument("filenames", nargs="*")

    args = parser.parse_args()

    headers = {
        "Authorization": get_authorization_header(
            "MDAyOWxvY2F0aW9uIG15YXBwcy5kZXZlbG9wZXIudWJ1bnR1LmNvbQowMDE2aWRlbnRpZmllciBNeUFwcHMKMDA0YmNpZCBteWFwcHMuZGV2ZWxvcGVyLnVidW50dS5jb218dmFsaWRfc2luY2V8MjAxOC0wOS0xM1QxMzozNzoyMS4wNDEyMDIKMDE3ZGNpZCB7InNlY3JldCI6ICJWdFVBU2dyQWVjaWJ3WXZzbTA3U25KNFM1ZStJWWdPYmR4dFFsbjUxd0lsZ0FPZVdoeFd0MEllcVAzMElCaTVURDZTMit6NmdMUTFoak9WNWxxeXdmc3MxWXhocCtrdTQ2RDV0QTRsYkpNcmJsUlcvaEwwSG03ajhkeUZDTXYwbEVVUDdUWmdYcDVSa0FMdG50cVJpanI4V1Q0R1I1Vy9Wc0ZxdHFvU3o4OW1OM2JmK29Cbk1ZQ0dOWnNIL2lycGRiK1U5YmwwSWQ2UVNFRmZBd0FuWlh3cVUzTGMyZTdRMmdqL2NVRlBXSTZiQnBZTWdURmJWYWg0NzFoZy9JdW1GM1RPYUZxaUZnSlNhM1EyVThVdFArSmVycTZEMzRVSVQyOXAydmpzeUFvakRWQ0JvYkFlTklpMVBRc3Nra3NhdXZqK2RsRzhMdDRJb1ZxZDVsdG91MUE9PSIsICJ2ZXJzaW9uIjogMX0KMDA1MXZpZCAAHb7bE_SILtaBd-Xi_7A81GMojYIqJgMcOhV075yEH2bVztjqsQ8w1I5gDHeiOLGf1H3Sz9orQAbw32svQrI1HUoOlCkXbigKMDAxOGNsIGxvZ2luLnVidW50dS5jb20KMDA1ZGNpZCBteWFwcHMuZGV2ZWxvcGVyLnVidW50dS5jb218YWNsfFsicGFja2FnZV9hY2Nlc3MiLCAicGFja2FnZV91cGxvYWQiLCAiZWRpdF9hY2NvdW50Il0KMDAyZnNpZ25hdHVyZSBJtgDwvkm2FjDuL9k4rZvwAJcJKhK1tfE9cWp49pRZhAo",
            "MDAxZWxvY2F0aW9uIGxvZ2luLnVidW50dS5jb20KMDE4NGlkZW50aWZpZXIgeyJzZWNyZXQiOiAiVnRVQVNnckFlY2lid1l2c20wN1NuSjRTNWUrSVlnT2JkeHRRbG41MXdJbGdBT2VXaHhXdDBJZXFQMzBJQmk1VEQ2UzIrejZnTFExaGpPVjVscXl3ZnNzMVl4aHAra3U0NkQ1dEE0bGJKTXJibFJXL2hMMEhtN2o4ZHlGQ012MGxFVVA3VFpnWHA1UmtBTHRudHFSaWpyOFdUNEdSNVcvVnNGcXRxb1N6ODltTjNiZitvQm5NWUNHTlpzSC9pcnBkYitVOWJsMElkNlFTRUZmQXdBblpYd3FVM0xjMmU3UTJnai9jVUZQV0k2YkJwWU1nVEZiVmFoNDcxaGcvSXVtRjNUT2FGcWlGZ0pTYTNRMlU4VXRQK0plcnE2RDM0VUlUMjlwMnZqc3lBb2pEVkNCb2JBZU5JaTFQUXNza2tzYXV2aitkbEc4THQ0SW9WcWQ1bHRvdTFBPT0iLCAidmVyc2lvbiI6IDF9CjAwY2FjaWQgbG9naW4udWJ1bnR1LmNvbXxhY2NvdW50fGV5SjFjMlZ5Ym1GdFpTSTZJQ0owWW0xaUlpd2dJbTl3Wlc1cFpDSTZJQ0pOTmxKTWFFdDNJaXdnSW1ScGMzQnNZWGx1WVcxbElqb2dJbFJvYjIxaGN5QkNhV3hzWlNJc0lDSmxiV0ZwYkNJNklDSjBiM1J2UUdOaGJtOXVhV05oYkM1amIyMGlMQ0FpYVhOZmRtVnlhV1pwWldRaU9pQjBjblZsZlE9PQowMDQwY2lkIGxvZ2luLnVidW50dS5jb218dmFsaWRfc2luY2V8MjAxOC0wOS0xM1QxMzozNzoyMi45MTY3MzMKMDAzZWNpZCBsb2dpbi51YnVudHUuY29tfGxhc3RfYXV0aHwyMDE4LTA5LTEzVDEzOjM3OjIyLjkxNjczMwowMDNjY2lkIGxvZ2luLnVidW50dS5jb218ZXhwaXJlc3wyMDE5LTA5LTEzVDEzOjM3OjIyLjkxNjc2NAowMDJmc2lnbmF0dXJlIMEZHnwG2CFHbUA_CmEdPE9-p6r-K-5AmrPGWRRkHQ6ZCg",
        )
    }

    print("Finding {} snap ...".format(args.snap_name))
    url = "https://dashboard.snapcraft.io/dev/api/account"
    r = requests.get(url, headers=headers)
    try:
        snap_id = r.json()["snaps"]["16"][args.snap_name]["snap-id"]
    except KeyError:
        print("Snap not found!")
        return

    url = "https://dashboard.snapcraft.io/dev/api/snaps/{}/binary-metadata".format(
        snap_id
    )
    r = requests.get(url, headers=headers)
    info = r.json()
    print(info)

    if args.action == "download":
        for entry in info:
            print("Downloading {} ...".format(entry["filename"]))
            with open(entry["filename"], "wb") as fd, requests.get(
                entry["url"], stream=True
            ) as r:
                for chunk in r.iter_content(chunk_size=512):
                    if chunk:
                        fd.write(chunk)
    elif args.action == "view":
        print()
        print(info)
    elif args.action == "upload":
        files = []
        for fn in args.filenames:
            info.append(
                {
                    "key": fn,
                    "filename": fn,
                    "type": "icon",
                    "hash": get_hash(fn),
                }
            )
            files.append((fn, (fn, open(fn, "rb"), "image/png")))
        data = {"info": json.dumps(info)}
        r = requests.put(url, data=data, files=files, headers=headers)
        print()
        print(r.json())
    elif args.action == "remove":
        new_info = [e for e in info if e["filename"] not in args.filenames]
        files = {"info": ("", json.dumps(new_info))}
        r = requests.put(url, data=None, files=files, headers=headers)
        print()
        print(r.json())
    elif args.action == "change":
        new_info = [
            {
                "hash": "e846d4e48415e3c796ea2cac0837f8811d582da7557e4a3c09d660158c40a661",
                "filename": "snapcraft.png",
                "type": "screenshot",
            },
            {
                "hash": "5eb253a70262c0dca5858435f31f80fec5352b48da9e61dde4c391e34aa79e25",
                "filename": "canteen.png",
                "type": "screenshot",
            },
            {
                "hash": "25b9679012862667442649513b7200480640d980d20663ba9748c1450d78d397",
                "filename": "kibana_ssho1.png",
                "type": "screenshot",
            },
        ]
        files = {"info": ("", json.dumps(new_info))}
        r = requests.put(url, data=None, files=files, headers=headers)
        print()
        print(r.json())

    print("Bye !!")


if __name__ == "__main__":
    main()
