import flask

import requests


def proxies_blueprint(store_query=None, testing=False):
    proxies = flask.Blueprint(
        "proxies",
        __name__,
        template_folder="/templates",
        static_folder="/static",
    )

    @proxies.route("/p/i/<path:url>")
    def proxy_image(url):
        stream = requests.get(url, stream=True, params=flask.request.args)

        def generate():
            for chunk in stream.iter_content(1024):
                yield chunk

        return flask.Response(generate(), headers=dict(stream.headers))

    return proxies
