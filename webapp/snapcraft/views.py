import flask
import prometheus_client
from talisker import logging

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

    @snapcraft.route("/account.json")
    def get_account_json():
        """
        A JSON endpoint to request login status
        """
        try:
            publisher = None

            if "publisher" in flask.session:
                publisher = flask.session["publisher"]

            response = {"publisher": publisher}
            response = flask.make_response(response)

            # Unset the last_login_method cookie to avoid forcing
            response.set_cookie("last_login_method", "", expires=0)

            response.headers["Cache-Control"] = "no-store"

            return response
        except Exception as e:
            logging.getLogger("talisker.wsgi").error(
                "Error with session: %s", e
            )

            response = {"error": "Error fetching account information"}
            response = flask.make_response(response)
            response.headers["Cache-Control"] = "no-store"
            return response, 502

    @snapcraft.route("/iot")
    def iot():
        status_code = 200

        icon_host = "https://dashboard.snapcraft.io/site_media/appmedia"
        assets_host = "https://assets.ubuntu.com/v1"

        devices = [
            {
                "package_name": "ubuntu-frame-osk",
                "icon_url": "/".join([icon_host, "2023/03/icon_2_Frame.png"]),
                "title": "Ubuntu Frame",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "mir-kiosk",
                "icon_url": "/".join(
                    [icon_host, "2021/06/mir-sqr-stacked-orng.png"]
                ),
                "title": "mir-kiosk",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "edgexfoundry",
                "icon_url": "/".join([icon_host, "2018/12/icon_Hx6IyH0.png"]),
                "title": "Edgexfoundry",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "node-red",
                "icon_url": "/".join(
                    [icon_host, "2018/03/icon.svg_UYFdU9y.png"]
                ),
                "title": "Node-Red",
                "developer_name": "Node-RED-Team (noderedteam)",
                "developer_link": "/publisher/noderedteam",
                "developer_validation": "verified",
            },
            {
                "package_name": "bluez",
                "icon_url": "/".join(
                    [icon_host, "2020/05/bluez-logo-2.jpg.png"]
                ),
                "title": "bluez",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "zwave-js-ui",
                "icon_url": "/".join(
                    [icon_host, "2019/03/new_domotz_icon.png"]
                ),
                "title": "Zwave JS UI",
                "developer_name": "Giaever.online (giaever-online)",
                "developer_link": "/publisher/giaever-online",
            },
            {
                "package_name": "ubports-installer",
                "icon_url": "/".join(
                    [icon_host, "2017/09/256x256_h3aYso1.png"]
                ),
                "title": "ubports-installer",
                "developer_name": "UBports",
                "developer_link": "/publisher/ubports",
            },
            {
                "package_name": "librepcb",
                "icon_url": "/".join([icon_host, "2022/10/librepcb.png"]),
                "title": "LibrePCB",
                "developer_name": "librepcb",
                "developer_link": "/publisher/librepcb",
                "developer_validation": "verified",
            },
            {
                "package_name": "ammp-edge",
                "icon_url": "/".join(
                    [icon_host, "2020/12/glyph-rounder-square-180px.png"]
                ),
                "title": "ammp-edge",
                "developer_name": "AMMP Technologies (ammp)",
                "developer_link": "/publisher/ammp",
            },
            {
                "package_name": "pi-bluetooth",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "pi-bluetooth",
                "developer_name": "Dave Jones (waveform)",
                "developer_link": "/publisher/waveform",
            },
        ]

        robotics = [
            {
                "package_name": "arduino",
                "icon_url": "/".join([icon_host, "2020/02/icon_s4HbwJl.png"]),
                "title": "Arduino IDE",
                "developer_name": "Snapcrafters",
                "developer_link": "/publisher/snapcrafters",
                "developer_validation": "starred",
            },
            {
                "package_name": "rosbot-xl",
                "icon_url": "/".join([icon_host, "2024/06/rosbot-xl.png"]),
                "title": "ROSbot XL",
                "developer_name": "Husarion",
                "developer_link": "/publisher/husarion",
                "developer_validation": "verified",
            },
            {
                "package_name": "rosbot-xl-teleop",
                "icon_url": "/".join(
                    [icon_host, "2023/10/popr512x512px_rosbot_xl_teleop.png"]
                ),
                "title": "ROSbot XL: teleop",
                "developer_name": "Husarion",
                "developer_link": "/publisher/husarion",
                "developer_validation": "verified",
            },
            {
                "package_name": "webots",
                "icon_url": "/".join([icon_host, "2019/08/webots.png"]),
                "title": "Webots",
                "developer_name": "Cyberbotics",
                "developer_link": "/publisher/cyberbotics",
            },
            {
                "package_name": "gazebo",
                "icon_url": "/".join([icon_host, "2022/05/icon.svg.png"]),
                "title": "gazebo",
                "developer_name": (
                    "Ubuntu Robotics Community (ubuntu-robotics-community)"
                ),
                "developer_link": "/publisher/ubuntu-robotics-community",
                "developer_validation": "verified",
            },
            {
                "package_name": "ros2-cli",
                "icon_url": "/".join(
                    [icon_host, "2023/02/ros2-cli_icon_1.png"]
                ),
                "title": "ros2-cli",
                "developer_name": (
                    "Ubuntu Robotics Community (ubuntu-robotics-community)"
                ),
                "developer_link": "/publisher/ubuntu-robotics-community",
                "developer_validation": "verified",
            },
            {
                "package_name": "vulcanexus-router",
                "icon_url": "/".join([icon_host, "2023/05/V-DDSRouter.png"]),
                "title": "Vulcanexus Router",
                "developer_name": "eProsima",
                "developer_link": "/publisher/eprosima",
            },
            {
                "package_name": "bow-webots",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "BOW Webots",
                "developer_name": "Daniel Camilleri (bow-robotics)",
                "developer_link": "/publisher/bow-robotics",
            },
            {
                "package_name": "foxglove-studio",
                "icon_url": "/".join([icon_host, "2022/07/fs-icon.svg.png"]),
                "title": "foxglove-studio",
                "developer_name": "Roman Shtylman (roman-foxglove)",
                "developer_link": "/publisher/roman-foxglove",
            },
            {
                "package_name": "husarion-ouster",
                "icon_url": "/".join(
                    [icon_host, "2023/10/husarion-ouster.png"]
                ),
                "title": "husarion-ouster",
                "developer_name": "Husarion",
                "developer_link": "/publisher/husarion",
                "developer_validation": "verified",
            },
        ]

        smart_home = [
            {
                "package_name": "openhab",
                "icon_url": "/".join([icon_host, "2017/11/favicon.png"]),
                "title": "openhab",
                "developer_name": "openHAB Foundation e.V. (openhab)",
                "developer_link": "/publisher/openhab",
            },
            {
                "package_name": "homebridge",
                "icon_url": "/".join([icon_host, "2018/10/Logo2x.png"]),
                "title": "homebridge",
                "developer_name": "Ondrej Kubik (ondra)",
            },
            {
                "package_name": "home-assistant-snap",
                "icon_url": "/".join(
                    [icon_host, "2020/07/favicon-192x192.png"]
                ),
                "title": "Home Assistant",
                "developer_name": "Giaever.online (giaever-online)",
                "developer_link": "/publisher/giaever-online",
            },
            {
                "package_name": "security-bear",
                "icon_url": "/".join(
                    [icon_host, "2020/11/security-bear_Logo.png"]
                ),
                "title": "security-bear",
                "developer_name": "CyBear Jinni (cybearjinni)",
                "developer_link": "/publisher/cybearjinni",
            },
            {
                "package_name": "chip-tool",
                "icon_url": "/".join([icon_host, "2023/01/1F3E0_color.png"]),
                "title": "chip-tool",
                "developer_name": "Canonical IoT Labs (canonical-iot-labs)",
                "developer_link": "/publisher/canonical-iot-labs",
            },
            {
                "package_name": "openthread-border-router",
                "icon_url": "/".join(
                    [icon_host, "2023/09/ThreadLogo-stort-1.png"]
                ),
                "title": "openthread-border-router",
                "developer_name": "Canonical IoT Labs (canonical-iot-labs)",
                "developer_link": "/publisher/canonical-iot-labs",
            },
            {
                "package_name": "matter-bridge-tapo-lighting",
                "icon_url": "/".join(
                    [icon_host, "2023/01/1F3E0_color_8tMXOjP.png"]
                ),
                "title": "matter-bridge-tapo-lighting",
                "developer_name": "Canonical IoT Labs (canonical-iot-labs)",
                "developer_link": "/publisher/canonical-iot-labs",
            },
            {
                "package_name": "matter-pi-gpio-commander",
                "icon_url": "/".join([icon_host, "2023/03/E1C7_color.png"]),
                "title": "matter-pi-gpio-commander",
                "developer_name": "Canonical IoT Labs (canonical-iot-labs)",
                "developer_link": "/publisher/canonical-iot-labs",
            },
        ]

        networking = [
            {
                "package_name": "mosquitto",
                "icon_url": "/".join(
                    [icon_host, "2018/08/mosquitto-logo-only.svg.png"]
                ),
                "title": "mosquitto",
                "developer_name": "Mosquitto Team (mosquitto)",
                "developer_link": "/publisher/mosquitto",
                "developer_validation": "verified",
            },
            {
                "package_name": "domotzpro-agent-publicstore",
                "icon_url": "/".join(
                    [icon_host, "2019/03/new_domotz_icon.png"]
                ),
                "title": "Domotz Pro Agent",
                "developer_name": "Domotz (domotzpublicstore)",
                "developer_link": "/publisher/domotzpublicstore",
                "developer_validation": "verified",
            },
            {
                "package_name": "adguard-home",
                "icon_url": "/".join([icon_host, "2020/04/256.png"]),
                "title": "AdGuard Home",
                "developer_name": "AdGuard (ameshkov)",
                "developer_link": "/publisher/ameshkov",
                "developer_validation": "verified",
            },
            {
                "package_name": "flexran",
                "icon_url": "/".join([icon_host, "2018/04/m5g-flexran.png"]),
                "title": "flexran",
                "developer_name": "Mosaic 5G (mosaic-5g)",
                "developer_link": "/publisher/mosaic-5g",
            },
            {
                "package_name": "modem-manager",
                "icon_url": "/".join([icon_host, "2020/05/mm-logo.png"]),
                "title": "modem-manager",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "snap-store-proxy",
                "icon_url": "/".join(
                    [icon_host, "2018/09/Snapcraft_Proxy_Aubergine-256.png"]
                ),
                "title": "snap-store-proxy",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
        ]

        board_images = [
            {
                "package_name": "pc",
                "icon_url": "/".join([icon_host, "2016/07/icon_30.png"]),
                "title": "PC",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "rpi-imager",
                "icon_url": "/".join([icon_host, "2020/03/rpi-imager.png"]),
                "title": "rpi-imager",
                "developer_name": "Dave Jones (waveform)",
                "developer_link": "/publisher/waveform",
            },
            {
                "package_name": "pi-desktop",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "pi-desktop",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "develper_validation": "verified",
            },
            {
                "package_name": "pi",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "pi",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "pi2",
                "icon_url": "/".join([icon_host, "2015/04/berry.jpg.png"]),
                "title": "pi2",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
            {
                "package_name": "pi3",
                "icon_url": "/".join(
                    [assets_host, "be6eb412-snapcraft-missing-icon.svg"]
                ),
                "title": "pi3",
                "developer_name": "Canonical",
                "developer_link": "/publisher/canonical",
                "developer_validation": "verified",
            },
        ]

        context = {
            "devices": devices,
            "robotics": robotics,
            "smart_home": smart_home,
            "networking": networking,
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

    @snapcraft.route("/about/contact-us")
    def about_contact():
        return flask.render_template("contact-us.html")

    @snapcraft.route("/about/thank-you")
    def about_thankyou():
        return flask.render_template("thank-you.html")

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

    return snapcraft
