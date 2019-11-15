from launchpadlib.launchpad import Launchpad


launchpad = Launchpad.login_anonymously(
    "storefront", "production", version="devel"
)
