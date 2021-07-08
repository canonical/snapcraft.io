import flask
import prometheus_client

from webapp.snapcraft import logic


users_with_js = prometheus_client.Counter(
    "users_with_js", "A counter of sessions with JS"
)
users_without_js = prometheus_client.Counter(
    "users_without_js", "A counter of sessions without JS"
)


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
                "origin": "mosquitto",
                "publisher": "Mosquitto Team",
                "developer_validation": "verified",
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
                "package_name": "nymea",
                "icon_url": "/".join(
                    [icon_host, "2018/03/icon.svg_UYFdU9y.png"]
                ),
                "title": "nymea:core",
                "origin": "nymea GmbH developer",
                "publisher": "nymea GmbH developer",
            },
            {
                "package_name": "nymea-app",
                "icon_url": "/".join(
                    [icon_host, "2018/03/icon.svg_UYFdU9y.png"]
                ),
                "title": "nymea:app",
                "origin": "nymea GmbH developer",
                "publisher": "nymea GmbH developer",
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
            {
                "package_name": "mycroft",
                "icon_url": "/".join([icon_host, "2018/06/icon_brV5dye.png"]),
                "title": "Mycroft AI",
                "origin": "Mycroft AI",
                "publisher": "Mycroft AI",
            },
            {
                "package_name": "edgexfoundry",
                "icon_url": "/".join([icon_host, "2018/12/icon_Hx6IyH0.png"]),
                "title": "edgexfoundry",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "mir-kiosk",
                "icon_url": "/".join(
                    [icon_host, "2021/06/mir-sqr-stacked-orng.png"]
                ),
                "title": "mir-kiosk",
                "origin": "Canonical",
                "publisher": "Canonical",
                "developer_validation": "verified",
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
            {
                "package_name": "rpi-imager",
                "icon_url": "/".join([icon_host, "2020/03/rpi-imager.png"]),
                "title": "Raspberry Pi Imager",
                "origin": "Alan Pope",
                "publisher": "Alan Pope",
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

    @snapcraft.route("/about")
    def about():
        return flask.render_template("about/index.html")

    @snapcraft.route("/about/publish")
    def about_publish():
        return flask.render_template("about/publish.html")

    @snapcraft.route("/about/listing")
    def about_listing():
        return flask.render_template("about/listing.html")

    @snapcraft.route("/about/release")
    def about_release():
        return flask.render_template("about/release.html")

    @snapcraft.route("/about/publicise")
    def about_publicise():
        return flask.render_template("about/publicise.html")

    @snapcraft.route("/community")
    def community_redirect():
        return flask.redirect("/")

    @snapcraft.route("/create")
    def create_redirect():
        return flask.redirect("https://docs.snapcraft.io/build-snaps")

    @snapcraft.route("/build")
    def build():
        status_code = 200

        return flask.render_template("snapcraft/build.html"), status_code

    @snapcraft.route("/sitemap.xml")
    def sitemap():
        xml_sitemap = flask.render_template(
            "sitemap/sitemap-index.xml",
            base_url="https://snapcraft.io",
        )
        response = flask.make_response(xml_sitemap)
        response.headers["Content-Type"] = "application/xml"

        return response

    @snapcraft.route("/sitemap-links.xml")
    def sitemap_links():
        base_url = "https://snapcraft.io"
        links = [
            {"url": f"{base_url}/about"},
            {"url": f"{base_url}/about/publish"},
            {"url": f"{base_url}/about/listing"},
            {"url": f"{base_url}/about/release"},
            {"url": f"{base_url}/about/publicise"},
            {"url": f"{base_url}/iot"},
        ]

        xml_sitemap = flask.render_template(
            "sitemap/sitemap.xml",
            base_url="https://snapcraft.io",
            links=links,
        )
        response = flask.make_response(xml_sitemap)
        response.headers["Content-Type"] = "application/xml"
        response.headers["Cache-Control"] = "public, max-age=43200"

        return response

    @snapcraft.route("/snapcraft-no-js.png")
    def pixel_no_js():
        users_without_js.inc()
        response = flask.make_response(
            flask.send_file("snapcraft/snapcraft.png", mimetype="image/png")
        )
        response.headers["Cache-Control"] = "private"
        return response

    @snapcraft.route("/snapcraft-with-js.png")
    def pixel_with_js():
        users_with_js.inc()
        response = flask.make_response(
            flask.send_file("snapcraft/snapcraft.png", mimetype="image/png")
        )
        response.headers["Cache-Control"] = "private"
        return response

    return snapcraft
