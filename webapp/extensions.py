from flask_wtf.csrf import CSRFProtect
from canonicalwebteam.flask_vite import FlaskVite

csrf = CSRFProtect()
vite = FlaskVite()
