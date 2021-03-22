import re
from uuid import UUID

from marshmallow import ValidationError

class Sha1:

    def __init__(self, *, error = None):
        self.error = error

    def __call__(self, value):
        if not bool(re.match(r"^[a-fA-F0-9]{40}$", value)):
            raise ValidationError(self.error or "Not a valid sha1 hash")
        return value


class Mobile:

    def __init__(self, *, error = None):
        self.error = error

    def __call__(self, value):
        if not bool(re.match(r"^\+\d+ \d+$", value)):
            raise ValidationError(self.error or "Not a valid mobile number")
        return value

class Uuid:

    def __init__(self, *, error = None):
        self.error = error

    def __call__(self, value):
        try:
            uuid_val = UUID(value)
            if uuid_val.hex.lower() != value.replace("-", "").lower():
                raise ValidationError(self.error or "Not a valid uuid")
            return uuid_val.urn.split(":")[-1]
        except ValueError:
            raise ValidationError(self.error or "Not a valid uuid")