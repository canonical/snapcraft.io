from webapp import helpers

VALID_OS_VALUES = {"linux", "macos"}


def is_valid_language_and_os(language, os):
    filename = f"first_snap/content/{language}"
    return helpers.directory_exists(filename) and os in VALID_OS_VALUES
