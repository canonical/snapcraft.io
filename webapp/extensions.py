from flask_wtf.csrf import CSRFProtect
from webapp.vite_integration import FlaskVite

csrf = CSRFProtect()
vite = FlaskVite()
