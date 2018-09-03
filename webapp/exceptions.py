class ValidationError(Exception):
    """Custom validation error exception"""
    def __init__(self, msg):
        return super.__init__(msg)
