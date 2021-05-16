import time
import uuid

from flask import Blueprint, request
from sqlalchemy import and_
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Group import Group
from model.GroupApplication import GroupApplication
from model.Semester import Semester
from model.User import User
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
semester_api = Blueprint("semester_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@semester_api.route("/semester/archived", methods=["POST"])
def archive_semester():
    """Archive the current semester
    ---
    tags:
      - semester

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
              name:
                type: string
                description: semester name
                example: 2020-2021
                max: 256
            required:
              - name

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_json = parser.parse({
        "name": fields.Str(required=True, validate=validate.Length(min=1, max=256)),
    }, request, location="json")
    name: str = args_json["name"]

    token_info = Auth.get_payload(request)
    if not token_info['role'] == 'ADMIN':
        raise ApiPermissionException('Permission denied: Not logged in as admin')

    # check dup name
    dup_semester = Semester.query.filter_by(name=name).first()
    if dup_semester is not None:
        raise ApiDuplicateResourceException("Resource conflict: name already used")

    # remove all applications
    GroupApplication.query.delete()
    # rename current semester and set end time
    semester = Semester.query.filter_by(name="CURRENT").first()
    semester.name = name
    semester.end_time = time.time()
    # create new semester
    db.session.add(Semester(
        uuid=uuid.uuid4().bytes,
        name="CURRENT",
        start_time=int(time.time()),
        config={
            "system_state": {
                "grouping_ddl": None,
                "proposal_ddl": None
            },
            "group_member_number": [7, 9]
        }
    ))
    db.session.commit()

    return MyResponse().build()


@semester_api.route("/semester", methods=["GET"])
def get_semester_list():
    """Get list of semester
    ---
    tags:
      - semester

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
                  uuid:
                    type: string
                    description: semester name uuid
                    example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                  name:
                    type: string
                    description: semester name
                    example: 2020-2021
                  start_time:
                    type: number
                    description: unix timestamp of semester creation time
                    example: 1618847321
                  end_time:
                    type: number
                    description: unix timestamp of semester archived time
                    example: 1618847321

    """
    token_info = Auth.get_payload(request)

    semesters = Semester.query.filter(Semester.name != "CURRENT").all()

    return MyResponse(data=[{
        "uuid": str(uuid.UUID(bytes=semester.uuid)),
        "name": semester.name,
        "start_time": semester.start_time,
        "end_time": semester.end_time
    } for semester in semesters]).build()


@semester_api.route("/semester/<semester_uuid>", methods=["PATCH"])
def rename_semester(semester_uuid):
    """Rename the archived semester
    ---
    tags:
      - semester

    description: |
      ## Constrains
      * operator must be admin
      * semester must not be current
    parameters:
      - name: semester_uuid
        in: path
        required: true
        description: semester uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                description: semester name
                example: 2020-2021
                max: 256
            required:
              - name

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "semester_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    args_json = parser.parse({
        "name": fields.Str(required=True, validate=[validate.Length(min=1, max=256), validate.NoneOf(["CURRENT"])]),
    }, request, location="json")
    semester_uuid: str = args_path["semester_uuid"]
    new_name: str = args_json["name"]

    token_info = Auth.get_payload(request)

    if not token_info['role'] == 'ADMIN':
        raise ApiPermissionException('You have no permission to change the name of semester!')

    semester = Semester.query.filter_by(uuid=uuid.UUID(semester_uuid).bytes).first()
    if semester is None:
        raise ApiResourceNotFoundException('Not found: invalid semester uuid')
    if semester.name == 'CURRENT':
        raise ApiPermissionException('Permission denied: Current semester cannot be renamed')
    if new_name is not None:
        old_semester = Semester.query.filter_by(name=new_name).first()
        if old_semester is not None:
            raise ApiDuplicateResourceException("Resource conflict: name already used")
        semester.name = new_name
    db.session.commit()
    return MyResponse().build()


@semester_api.route("/semester/<semester_uuid>", methods=["DELETE"])
def delete_semester(semester_uuid):
    """Delete a archived semester
    ---
    tags:
      - semester

    description: |
      ## Constrains
      * operator must be admin
      * all objects related to the semester need to be deleted

    parameters:
      - name: semester_uuid
        in: path
        required: true
        description: semester uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      200:
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "semester_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    semester_uuid: str = args_path["semester_uuid"]

    token_info = Auth.get_payload(request)

    if not token_info['role'] == 'ADMIN':
        raise ApiPermissionException('You have no permission to change the name of semester!')

    semester = Semester.query.filter_by(uuid=uuid.UUID(semester_uuid).bytes).first()
    if semester is None:
        raise ApiResourceNotFoundException('Not found: invalid semester uuid')
    if semester.name == 'CURRENT':
        raise ApiPermissionException('Permission denied: Current semester cannot be deleted')

    # delete all within semester
    User.query.filter(and_(
        User.creation_time.between(semester.start_time, semester.end_time),
        User.role != "ADMIN"
    )).delete(synchronize_session=False)

    db.session.delete(semester)
    db.session.commit()

    return MyResponse().build()
