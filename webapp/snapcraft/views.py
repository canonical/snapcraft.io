import flask
from webapp.snapcraft import logic


def snapcraft_blueprint():
    snapcraft = flask.Blueprint("snapcraft", __name__)

    @snapcraft.route("/")
    def homepage():
        nps = flask.request.args.get("nps")

        livestream = logic.get_livestreams()

        return flask.render_template(
            "index.html", nps=nps, livestream=livestream
        )

    @snapcraft.route("/iot")
    def iot():
        status_code = 200

        icon_host = "https://dashboard.snapcraft.io/site_media/appmedia"
        assets_host = "https://assets.ubuntu.com/v1"

        iot_tools_and_server = [
            {
                "package_name": "mosquitto",
                "icon_url": "/".join(
                    [icon_host, "2018/08/mosquitto-logo-only.svg.png"]
                ),
                "title": "mosquitto",
                "origin": "ralight",
                "publisher": "Roger Light",
            },
            {
                "package_name": "node-red",
                "icon_url": "/".join([icon_host, "2017/01/nr-hex_1.png"]),
                "title": "Node-RED",
                "origin": "noderedteam",
                "publisher": "Node-RED-Team",
                "developer_validation": "verified",
            },
            {
                "package_name": "soracom-console",
                "icon_url": "/".join([icon_host, "2017/02/logo-256_1.png"]),
                "title": "soracom-console",
                "origin": "soracom",
                "publisher": "SORACOM Snap Administrator",
            },
            {
                "package_name": "thinger-maker-server",
                "icon_url": "/".join([icon_host, "2017/03/thinger_256.png"]),
                "title": "Thinger.io Maker Server",
                "origin": "thinger",
                "publisher": "Alvaro Luis Bustamante",
            },
            {
                "package_name": "nymea",
                "icon_url": "/".join(
                    [icon_host, "2018/03/icon.svg_UYFdU9y.png"]
                ),
                "title": "nymea",
                "origin": "guh GmbH developer",
                "publisher": "guh GmbH developer",
            },
            {
                "package_name": "domotzpro-agent-publicstore",
                "icon_url": "/".join(
                    [icon_host, "2019/03/new_domotz_icon.png"]
                ),
                "title": "".join(
                    [
                        "Domotz Pro Agent - ",
                        "Remote Network monitoring and Management",
                    ]
                ),
                "origin": "domotzpublicstore",
                "publisher": "Domotz",
            },
        ]

        industrial_iot = [
            {
                "package_name": "kura",
                "icon_url": "/".join([icon_host, "2018/07/icon_8BAXEYq.png"]),
                "title": "Kura™",
                "origin": "ondra",
                "publisher": "Ondrej Kubik",
            },
            {
                "package_name": "hunt-r",
                "icon_url": "/".join(
                    [icon_host, "2018/05/logo_huntr256x256.png"]
                ),
                "title": "Lantern Tech - Hunt-R Series Gateway Firmware",
                "origin": "kmorales019",
                "publisher": "Lantern Technologies",
            },
            {
                "package_name": "ammp-edge",
                "icon_url": "/".join(
                    [icon_host, "2018/08/AMMP_Logo_-_solid_in_circle_256.png"]
                ),
                "title": "ammp-edge",
                "origin": "ammp",
                "publisher": "AMMP Technologies",
            },
            {
                "package_name": "lantern-water-iot",
                "icon_url": "/".join(
                    [icon_host, "2018/05/smart_water_logo_256x256.png"]
                ),
                "title": "Lantern Tech - Smart Water Gateway Firmware",
                "origin": "kmorales019",
                "publisher": "Lantern Technologies",
            },
            {
                "package_name": "bl-gateway",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "bl-gateway",
                "origin": "jessegrant",
                "publisher": "Jesse Grant",
            },
            {
                "package_name": "ixagent",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "ixagent",
                "origin": "ixot",
                "publisher": "Michael Hathaway",
            },
        ]

        networking = [
            {
                "package_name": "flexran",
                "icon_url": "/".join([icon_host, "2018/04/m5g-flexran.png"]),
                "title": "flexran",
                "origin": "mosaic-5g",
                "publisher": "Mosaic 5G",
            },
            {
                "package_name": "oai-cn",
                "icon_url": "/".join([icon_host, "2018/04/m5g-oai-cn.png"]),
                "title": "oai-cn",
                "origin": "mosaic-5g",
                "publisher": "Mosaic 5G",
            },
            {
                "package_name": "oai-ran",
                "icon_url": "/".join([icon_host, "2018/04/m5g-oai-ran.png"]),
                "title": "oai-ran",
                "origin": "mosaic-5g",
                "publisher": "Mosaic 5G",
            },
            {
                "package_name": "ll-mec",
                "icon_url": "/".join([icon_host, "2018/03/m5g-llmec.png"]),
                "title": "ll-mec",
                "origin": "mosaic-5g",
                "publisher": "Mosaic 5G",
            },
            {
                "package_name": "wifi-ap",
                "icon_url": "/".join([icon_host, "2016/08/icon_16.png"]),
                "title": "wifi-ap",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
            },
        ]

        home_gateway = [
            {
                "package_name": "openhab",
                "icon_url": "/".join([icon_host, "2017/11/favicon.png"]),
                "title": "openHAB",
                "origin": "openhab",
                "publisher": "openHAB Foundation e.V.",
            },
            {
                "package_name": "homebridge",
                "icon_url": "/".join(
                    [
                        icon_host,
                        "2018/06",
                        "40754647-531702de-6448-11e8-84c1-9f950d71d4cd.png",
                    ]
                ),
                "title": "HOMEbridge",
                "origin": "ondra",
                "publisher": "Ondrej Kubik",
            },
        ]

        board_images = [
            {
                "package_name": "pi2",
                "icon_url": "/".join([icon_host, "2015/04/berry.jpg.png"]),
                "title": "pi2",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "dragonboard",
                "icon_url": "/".join([icon_host, "2016/07/icon_32.png"]),
                "title": "dragonboard",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "pc",
                "icon_url": "/".join([icon_host, "2016/07/icon_30.png"]),
                "title": "PC",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
            },
        ]

        context = {
            "iot_tools_and_server": iot_tools_and_server,
            "industrial_iot": industrial_iot,
            "networking": networking,
            "home_gateway": home_gateway,
            "board_images": board_images,
        }

        return (
            flask.render_template("store/categories/iot.html", **context),
            status_code,
        )

    @snapcraft.route("/community")
    def community_redirect():
        return flask.redirect("/")

    @snapcraft.route("/create")
    def create_redirect():
        return flask.redirect("https://docs.snapcraft.io/build-snaps")

    @snapcraft.route("/favicon.ico")
    def favicon():
        return flask.redirect(
            "https://assets.ubuntu.com/v1/fdc99abe-ico_16px.png"
        )

    @snapcraft.route("/build")
    def build():
        status_code = 200

        return flask.render_template("snapcraft/build.html"), status_code

    @snapcraft.route("/robots.txt")
    def robots():
        return flask.Response("", mimetype="text/plain")

    @snapcraft.route("/humans.txt")
    def humans():
        return flask.send_file("../static/humans.txt")

    @snapcraft.route("/_status/check")
    def check():
        return "OK"

    return snapcraft
