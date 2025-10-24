EXTENSION_NAME = "canonicalwebteam.flask-vite"


class staticproperty(property):
    """
    Helper decorator that designates a static class method as a static property
    """

    def __get__(self, owner_self, owner_cls):
        return self.fget()
