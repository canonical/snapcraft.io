from flask_wtf.csrf import CSRFProtect
from flask_session import Session
from canonicalwebteam.flask_vite import FlaskVite

csrf = CSRFProtect()
vite = FlaskVite()
server_session = Session()
