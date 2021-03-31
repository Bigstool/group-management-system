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
system_api = Blueprint("system_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@system_api.route("/sysconfig", methods=["GET"])
def get_sys_config():
    """Get global config of the system
    ---
    tags:
      - system

    description: |

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
              properties:
                semester_id:
                  type: string
                  description: id of current semester
                  example: 2021S1
                system_state:
                  type: string
                  description: state of current system
                  enum: ["GROUPING", "PROPOSING", "FINISHED"]
                  example: GROUPING
    """
    pass # TODO


@system_api.route("/sysconfig", methods=["PATCH"])
def patch_sys_config():
    """Get list of group
    ---
    tags:
      - system

    description: |
      ## Constrains
      * operator must be admin

    responses:
      200:
        description: query success
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  semester_id:
                    type: string
                    description: id of current semester
                    example: 2021S1
                  system_state:
                    type: string
                    description: state of current system
                    enum: ["GROUPING", "PROPOSING", "FINISHED"]
                    example: GROUPING
    """
    pass # TODO
