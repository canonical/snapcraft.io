from werkzeug.middleware.dispatcher import DispatcherMiddleware
from webapp_beta.beta_app import app as beta_app
from webapp.app import create_app


main_app = create_app()
app = DispatcherMiddleware(main_app, {"/beta": beta_app})
