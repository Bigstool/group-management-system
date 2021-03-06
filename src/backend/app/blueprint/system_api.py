import hmac
import secrets
import time
import uuid
from datetime import datetime

from flask import Blueprint, request
from sqlalchemy import and_
from sqlalchemy.orm.attributes import flag_modified
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Semester import Semester
from model.User import User
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
                student_count:
                  type: integer
                  description: number of USER in current semester
                  example: 223
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
    semester = Semester.query.filter_by(name="CURRENT").first()
    semester.config["student_count"] = User.query.filter(
        and_(User.creation_time >= semester.start_time, User.role == "USER")).count()

    return MyResponse(data=semester.config).build()


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

    semester = Semester.query.filter_by(name="CURRENT").first()

    if new_system_state is not None and new_system_state["grouping_ddl"] is not None:
        semester.config['system_state']['grouping_ddl'] = int(new_system_state["grouping_ddl"])
    if new_system_state is not None and new_system_state["proposal_ddl"] is not None:
        semester.config['system_state']['proposal_ddl'] = int(new_system_state["proposal_ddl"])
    if new_group_member_number is not None:
        semester.config['group_member_number'] = new_group_member_number

    flag_modified(semester, "config")
    db.session.commit()

    # overwrite scheduled jobs
    if new_system_state is not None and new_system_state["grouping_ddl"] is not None:
        from blueprint.group_api import post_grouping_ddl_job
        from server import scheduler
        from apscheduler.triggers.date import DateTrigger
        run_time = datetime.fromtimestamp(new_system_state["grouping_ddl"])
        logger.info(f"Grouping DDL modified, post grouping DDL job scheduled at {run_time}")
        scheduler.add_job(func=post_grouping_ddl_job,
                          id="POST_GROUPING_DDL",
                          replace_existing=True,
                          trigger=DateTrigger(run_date=run_time))

    return MyResponse().build()
