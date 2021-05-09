import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from sqlalchemy.orm.attributes import flag_modified
from webargs import fields, validate
from webargs.flaskparser import parser

from blueprint.group_api import group_api
from model.GroupApplication import GroupApplication
from model.GroupComment import GroupComment
from model.GroupFavorite import GroupFavorite
from model.Semester import Semester
from model.Group import Group
from model.User import User
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse
from model.Group import Group

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
    pass  # TODO
    #check the role
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    if not (token_info["role"] == "ADMIN"):
        raise ApiPermissionException("You have no permission to archive the semester!")

    #rename the current semester
    args_json = parser.parse({
        "name": fields.Str(required=True, validate=validate.Length(min=1, max=256))
    }, request, location="json")
    new_name: str = args_json["name"]

    # foreign key constrains
    semester = Semester.query.filter_by(name="CURRENT").first()
    if new_name:
        semester.name = new_name
    semester.end_time = int(time.time())

    #If there is no cascade setting
    # group_list = Group.query.filter_by(semester_name="CURRENT").all()
    # for each in group_list:
    #     each.semester_name = new_name

    #create a new semester
    args_json = parser.parse({
        "system_state": fields.Nested({
                "grouping_ddl": fields.Number(missing=None),
                "proposal_ddl": fields.Number(missing=None)}, missing=None),
        "group_member_number": fields.List(fields.Int(), missing=None)
    }, request, location="json")
    new_system_state = args_json["system_state"]
    new_group_member_number = args_json["group_member_number"]
    new_config = {"system_state": new_system_state, "group_member_number": new_group_member_number}

    new_semester = Semester(uuid=uuid.uuid4().bytes,
                            name="CURRENT",
                            start_time=int(time.time()),
                            end_time=None,
                            config=new_config)
    db.session.add(new_semester)
    db.session.commit()
    return MyResponse(data=None, msg='query success').build()




@semester_api.route("/semester", methods=["GET"])
def get_semester_name_list():
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
    if token_info["role"] != "ADMIN":
        raise ApiPermissionException("Permission denied: you are not the administrator!")
    semester_list = Semester.query.all()
    response_list = []
    for semester in semester_list:
        response_list.append({
            "uuid": str(uuid.UUID(bytes=semester.uuid)),
            "name": semester.name,
            "start_time": semester.start_time,
            "end_time": semester.end_time
        })
    return MyResponse(data=response_list, msg='query success').build()


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
        "name": fields.Str(missing=None, validate=validate.Length(min=1, max=256)),
    }, request, location="json")
    semester_uuid: str = args_path["semester_uuid"]
    new_name: str = args_json["name"]
    token_info = Auth.get_payload(request)
    if not token_info['role'] == 'ADMIN':
        raise ApiPermissionException('You have no permission to change the name of semester!')
    semester = Semester.query.filter_by(uuid=uuid.UUID(semester_uuid).bytes).first()
    if semester is None:
        raise ApiResourceNotFoundException('No such semester!')
    if semester.name == 'CURRENT':
        raise ApiPermissionException('Cannot change the name of current semester')
    if new_name is not None:
        semester.name = new_name
    db.session.commit()
    return MyResponse(data=None, msg='query success').build()


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
    token_info = Auth.get_payload(request)
    if token_info["role"] != "ADMIN":
        raise ApiPermissionException("Permission denied: you are not the administrator!")

    args_path = parser.parse({
        "semester_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    semester_uuid: str = args_path["semester_uuid"]
    semester = Semester.query.filter_by(uuid=uuid.UUID(semester_uuid).bytes).first()
    if semester is None:
        raise ApiResourceNotFoundException("No such semester!")
    system_state = Semester.query.filter_by(name="CURRENT").first().config['system_state']

    semester_name = Semester.name
    groups = Group.query.filter_by(semester_name=semester_name).all()

    for group in groups:

        group_application = GroupApplication.query.filter_by(group_uuid=group.uuid).all()
        for application in group_application:
            db.session.delete(application)

        group_comment = GroupComment.query.filter_by(group_uuid=group.uuid).all()
        for comment in group_comment:
            db.session.delete(comment)

        group_Favorite = GroupFavorite.query.filter_by(group_uuid=group.uuid).all()
        for favorite in group_Favorite:
            db.session.delete(favorite)

        #default: all students during the semester assigned to a group
        users = User.query.filter_by(group_id=group.uuid).all()
        for user in users:
            db.session.delete(user)

        db.session.delete(group)
        db.session.commit()

    db.session.delete(semester)
    db.session.commit()
    return MyResponse(data=None).build()
