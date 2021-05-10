class ApiException(Exception):
    pass


class ApiInvalidInputException(ApiException):
    status_code = 400


class ApiDuplicateResourceException(ApiException):
    status_code = 409


class ApiResourceNotFoundException(ApiException):
    status_code = 404


class ApiPermissionException(ApiException):
    status_code = 403


class ApiTokenException(ApiException):
    status_code = 401


class ApiResourceLockedException(ApiException):
    status_code = 423


class ApiResourceOperationException(ApiException):
    status_code = 500

class ApiUnimplementedException(ApiException):
    status_code = 501