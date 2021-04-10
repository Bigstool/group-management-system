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
                system_state:
                  type: object
                  description: important time of current system
                  properties:
                    grouping_ddl:
                      type: number
                      description: timestamp of grouping
                      example: 1618054160
                    proposing_ddl:
                      type: number
                      description: timestamp of proposing
                      example: 1618054160
                group_member_number:
                  type: array
                  description: range of group member
                  example: [7, 9]
    """
    pass  # TODO


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
                 system_state:
                   type: object
                   description: important time of current system
                   properties:
                     grouping_ddl:
                       type: number
                       description: timestamp of grouping
                       example: 1618054160
                     proposing_ddl:
                       type: number
                       description: timestamp of proposing
                       example: 1618054160
                 group_member_number:
                   type: array
                   description: range of group member
                   example: [7, 9]
   """
    pass  # TODO
