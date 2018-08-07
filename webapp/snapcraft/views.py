import flask

from webapp.api.store import StoreApi
from webapp.store import logic
from webapp.api.exceptions import (
    ApiError,
    ApiTimeoutError,
    ApiResponseDecodeError,
    ApiResponseError,
    ApiResponseErrorList,
    ApiConnectionError
)


def snapcraft_blueprint():
    api = StoreApi()

    snapcraft = flask.Blueprint(
        'snapcraft', __name__,
        template_folder='/templates', static_folder='/static')

    def _handle_errors(api_error: ApiError):
        status_code = 502
        error = {
            'message': str(api_error)
        }

        if type(api_error) is ApiTimeoutError:
            status_code = 504
        elif type(api_error) is ApiResponseDecodeError:
            status_code = 502
        elif type(api_error) is ApiResponseErrorList:
            error['errors'] = api_error.errors
            status_code = 502
        elif type(api_error) is ApiResponseError:
            status_code = 502
        elif type(api_error) is ApiConnectionError:
            status_code = 502
        return status_code, error

    @snapcraft.route('/')
    def homepage():
        featured_snaps = []
        error_info = {}
        status_code = 200
        try:
            featured_snaps = logic.get_searched_snaps(
                api.get_featured_snaps()
            )
        except ApiError as api_error:
            status_code, error_info = _handle_errors(api_error)

        return flask.render_template(
            'index.html',
            featured_snaps=featured_snaps,
            error_info=error_info
        ), status_code

    @snapcraft.route('/iot')
    def iot():
        status_code = 200

        return flask.render_template(
            'store/categories/iot.html'
        ), status_code

    @snapcraft.route('/docs', defaults={'path': ''})
    @snapcraft.route('/docs/<path:path>')
    def docs_redirect(path):
        return flask.redirect('https://docs.snapcraft.io/' + path)

    @snapcraft.route('/community')
    def community_redirect():
        return flask.redirect('/')

    @snapcraft.route('/create')
    def create_redirect():
        return flask.redirect('https://docs.snapcraft.io/build-snaps')

    @snapcraft.route('/favicon.ico')
    def favicon():
        return flask.redirect(
            'https://assets.ubuntu.com/v1/fdc99abe-ico_16px.png')

    @snapcraft.route('/build')
    def build():
        status_code = 200

        return flask.render_template(
            'snapcraft/build.html'
        ), status_code

    return snapcraft
