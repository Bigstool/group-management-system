from shared import jwt_util
from utility.ApiException import *

class Auth:
    @staticmethod
    def get_payload(request):
        token = request.headers.get('Authorization')
        if not token:
            raise ApiPermissionException("Permission denied: not logged in")
        token = str.replace(str(token), 'Bearer ', '')
        token_info = jwt_util.decode_token(token, audience='access')
        return token_info