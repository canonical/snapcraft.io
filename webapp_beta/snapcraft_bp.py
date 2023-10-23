from flask import Blueprint

snapcraft_bp = Blueprint(
    "snapcraft_bp",
    __name__,
    template_folder="../templates",
    static_folder="../static",
)