import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from webargs import fields, validate
from webargs.flaskparser import parser

from model.SystemConfig import SystemConfig
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
notification_api = Blueprint("notification_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@notification_api.route("/user/<user_uuid>/notification", methods=["GET"])
def get_user_notification(user_uuid):
    """Get user's notification
    ---
    tags:
      - notification

    description: |
      ## Constrains
      * operator must be the user

    parameters:
      - name: user_uuid
        in: path
        required: true
        description: user uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  uuid:
                    type: string
                    description: notification uuid
                    example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
                  title:
                    type: string
                    description: notification title
                    example: Application
                  content:
                    type: string
                    description: notification content
                    example: Your application of group Jaxzefalk has been approved
                  creation_time:
                    type: integer
                    description: notification time
                    example: 1617189103
    """
    pass # TODO
