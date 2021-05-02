import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from sqlalchemy.orm.attributes import flag_modified
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Semester import Semester
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
    """Get global config of the current semester
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
                    proposal_ddl:
                      type: number
                      description: timestamp of proposal
                      example: 1618054160
                group_member_number:
                  type: array
                  description: range of group member
                  example: [7, 9]
    """
    record = Semester.query.filter_by(name="CURRENT").first()
    return MyResponse(data=record.config).build()


@system_api.route("/sysconfig", methods=["PATCH"])
def patch_sys_config():
    """Modify the config of current semester
    ---
    tags:
     - system

    description: |
     ## Constrains
     * operator must be admin

    requestBody:
      required: true
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
                    description: timestamp of grouping ddl
                    example: 1618054160
                  proposal_ddl:
                    type: number
                    description: timestamp of proposal ddl
                    example: 1618054160
              group_member_number:
                type: array
                description: range of group member
                example: [7, 9]
    responses:
     200:
       description: query success
       content:
         application/json:
           schema:
             type: object
   """
    token_info = Auth.get_payload(request)
    if token_info["role"] != "ADMIN":
        raise ApiPermissionException("Permission denied: you are not the administrator!")

    args_json = parser.parse({
        "system_state": fields.Nested({
            "grouping_ddl": fields.Number(missing=None),
            "proposal_ddl": fields.Number(missing=None)}, missing=None),
        "group_member_number": fields.List(fields.Int(), missing=None)
    }, request, location="json")

    new_system_state = args_json["system_state"]
    new_group_member_number = args_json["group_member_number"]

    record = Semester.query.filter_by(name="CURRENT").first()

    if new_system_state is not None and new_system_state["grouping_ddl"] is not None:
        record.config['system_state']['grouping_ddl'] = new_system_state["grouping_ddl"]
    if new_system_state is not None and new_system_state["proposal_ddl"] is not None:
        record.config['system_state']['proposal_ddl'] = new_system_state["proposal_ddl"]
    if new_group_member_number is not None:
        record.config['group_member_number'] = new_group_member_number

    flag_modified(record, "config")
    db.session.commit()

    return MyResponse(data=None, msg='query success').build()