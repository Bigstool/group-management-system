import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from webargs import fields, validate
from webargs.flaskparser import parser
from model.Notification import Notification
from model.Semester import Semester
from model.Group import Group
from model.User import User
from model.GroupApplication import GroupApplication
from model.GroupComment import GroupComment
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
application_api = Blueprint("application_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@application_api.route("/group/<group_uuid>/application", methods=["POST"])
def create_application(group_uuid):
    """Create an application to join the group
    ---
    tags:
      - application

    description: |
      ## Constrains
      * operator must not have possessed group or joined group
      * operator can have only one application for a group
      * application can only be created if system state is GROUPING
      * application can only be created if the group application_enabled=true
      * application can only be created if the group member count < system max member per group settings
    
    parameters:
      - name: group_uuid
        in: path
        required: true
        description: group uuid
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
              comment:
                type: string
                description: application comment
                example: FBI OPEN DA DOOR!
                max: 4096

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    args_json = parser.parse({
        "comment": fields.Str(missing=None, validate=validate.Length(max=4096))
    }, request, location="json")

    token_info = Auth.get_payload(request)

    group_uuid: str = args_path["group_uuid"]
    comment: str = args_json["comment"]

    if token_info["role"] == "ADMIN":
        raise ApiPermissionException("Permission denied: must logged in as user")

    group = Group.query.get(uuid.UUID(group_uuid).bytes)
    if group is None:
        raise ApiResourceNotFoundException("Not found: invalid group")

    user = User.query.get(uuid.UUID(token_info["uuid"]).bytes)
    if user.owned_group or user.joined_group:
        raise ApiPermissionException("Permission denied: You have already created/joined a group")

    application = GroupApplication.query.filter_by(applicant_uuid=user.uuid,
                                                   group_uuid=uuid.UUID(group_uuid).bytes).first()
    if application:
        raise ApiPermissionException("Permission denied: You already applied for this group")

    semester = Semester.query.filter_by(name="CURRENT").first()
    if not group.application_enabled:
        raise ApiPermissionException("Permission denied: Group application disabled")
    if semester.config["system_state"]["grouping_ddl"] < time.time():
        raise ApiPermissionException("Permission denied: Grouping ddl reached")
    if len(group.member) >= semester.config["group_member_number"][1]:
        raise ApiPermissionException("Permission denied: This group is full")

    new_application = GroupApplication(uuid=uuid.uuid4().bytes,
                                       comment=comment,
                                       applicant_uuid=user.uuid,
                                       group_uuid=group.uuid,
                                       creation_time=int(time.time()))
    db.session.add(new_application)
    db.session.commit()
    return MyResponse().build()


@application_api.route("/group/<group_uuid>/application", methods=["GET"])
def get_group_application_list(group_uuid):
    """Get list of group applications
    ---
    tags:
      - application

    description: |
      ## Constrains
      * operator must be group owner
      
    parameters:
      - name: group_uuid
        in: path
        required: true
        description: group uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

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
                    description: group application uuid
                    example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                  applicant:
                    type: object
                    description: the user who created the group
                    properties:
                      uuid:
                        type: string
                        description: user uuid
                        example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                      alias:
                        type: string
                        example: Ming Li
                      email:
                        type: string
                        example: Ming.Li@example.com
                  comment:
                    type: string
                    description: group application comment
                    example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                  creation_time:
                    type: integer
                    description: group creation time, unix timestamp
                    example: 1617189103
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="path")
    group_uuid: str = args_path["group_uuid"]

    token_info = Auth.get_payload(request)

    group = Group.query.filter_by(uuid=uuid.UUID(group_uuid).bytes).first()
    if group is None:
        raise ApiResourceNotFoundException("Not found: Invalid group uuid")

    if token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid)):
        raise ApiPermissionException("Permission denied: must logged in as group owner")

    application_list = GroupApplication.query.filter_by(group_uuid=uuid.UUID(group_uuid).bytes).all()
    ret = []
    for application in application_list:
        ret.append({
            "uuid": str(uuid.UUID(bytes=application.uuid)),
            "applicant": {
                "uuid": str(uuid.UUID(bytes=application.applicant.uuid)),
                "alias": application.applicant.alias,
                "email": application.applicant.email
            },
            "comment": application.comment,
            "creation_time": application.creation_time
        })
    return MyResponse(data=ret).build()


@application_api.route("/user/<user_uuid>/application", methods=["GET"])
def get_user_application_list(user_uuid):
    """Get list of user's applications
    ---
    tags:
      - application

    description: |
       ## Constrains
       * operator must be himself
    parameters:
      - name: user_uuid
        in: path
        required: true
        description: user uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

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
                    description: application uuid
                    example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                  group:
                    type: object
                    description: the user who created the group
                    properties:
                      uuid:
                        type: string
                        description: group uuid
                        example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                      name:
                        type: string
                        example: Jaxzefalk
                      title:
                        type: string
                        example: GMS
                      description:
                        type: string
                        example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                  comment:
                    type: string
                    description: group application comment
                    example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                  creation_time:
                    type: integer
                    description: group creation time, unix timestamp
                    example: 1617189103
    """
    args_path = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="path")
    user_uuid: str = args_path["user_uuid"]

    token_info = Auth.get_payload(request)

    if token_info["uuid"] != user_uuid:
        raise ApiPermissionException("Permission denied: no access to user's application")

    application_list = GroupApplication.query.filter_by(applicant_uuid=uuid.UUID(user_uuid).bytes).all()
    ret = []
    for application in application_list:
        ret.append({
            "uuid": str(uuid.UUID(bytes=application.uuid)),
            "group": {
                "uuid": str(uuid.UUID(bytes=application.group.uuid)),
                "name": application.group.name,
                "tile": application.group.title,
                "description": application.group.description,
            },
            "comment": application.comment,
            "creation_time": application.creation_time
        })
    return MyResponse(data=ret).build()


@application_api.route("/application/accepted", methods=["POST"])
def accept_application():
    """Accept the application
    ---
    tags:
      - application

    description: |
      ## Constrains
      * operator must be the group owner
      * group member amount limit not reached
      * application removed after the operation

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              uuid:
                type: string
                description: application uuid
                example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    # Check identity
    args_json = parser.parse({
        "uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="json")
    application_uuid: str = args_json["uuid"]

    token_info = Auth.get_payload(request)

    application = GroupApplication.query.filter_by(uuid=uuid.UUID(application_uuid).bytes).first()

    group = Group.query.filter_by(uuid=application.group_uuid).first()

    if (token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid))):
        raise ApiPermissionException("Permission denied: Must logged in as group owner")

    semester = Semester.query.filter_by(name="CURRENT").first()
    if len(group.member) >= semester.config["group_member_number"][1]:
        raise ApiPermissionException("Permission denied: Member number limit reached")

    # Add applicant to group
    applicant = User.query.get(application.applicant_uuid)
    applicant.joined_group_uuid = group.uuid
    # Remove application
    db.session.delete(application)
    # Remove user's other application
    # TODO
    # Create Notification
    new_notification = Notification(uuid=uuid.uuid4().bytes,
                                    user_uuid=application.applicant.uuid,
                                    title="Application",
                                    content="Your application to group " + group.name + " has been approved",
                                    creation_time=int(time.time()))
    db.session.add(new_notification)
    db.session.commit()
    return MyResponse().build()


@application_api.route("/application/rejected", methods=["POST"])
def reject_application():
    """Reject the application
    ---
    tags:
      - application

    description: |
      ## Constrains
      * operator must be the group owner
      * application removed after the operation

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              uuid:
                type: string
                description: application uuid
                example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    # Check identity
    args_json = parser.parse({
        "uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="json")
    application_uuid: str = args_json["uuid"]

    token_info = Auth.get_payload(request)

    application = GroupApplication.query.filter_by(uuid=uuid.UUID(application_uuid).bytes).first()

    group = Group.query.filter_by(uuid=application.group_uuid).first()

    if (token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid))):
        raise ApiPermissionException("Permission denied: Must logged in as group owner")

    # Remove application
    db.session.delete(application)
    # Create Notification
    new_notification = Notification(uuid=uuid.uuid4().bytes,
                                    user_uuid=application.applicant.uuid,
                                    title="Application",
                                    content="Your application to group " + group.name + " has been denied",
                                    creation_time=int(time.time()))
    db.session.add(new_notification)
    db.session.commit()
    return MyResponse().build()


@application_api.route("/application/<application_uuid>", methods=["DELETE"])
def delete_application(application_uuid):
    """Delete the application
    ---
    tags:
      - application

    description: |
      ## Constrains
      * operator must be the application creator
      * application removed after the operation

    parameters:
      - name: application_uuid
        in: path
        required: true
        description: application uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "application_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    application_uuid: str = args_path["application_uuid"]

    application = GroupApplication.query.get(uuid.UUID(application_uuid).bytes)

    # Check Identity
    token_info = Auth.get_payload(request)

    if (token_info["uuid"] != str(uuid.UUID(bytes=application.applicant_uuid))):
        raise ApiPermissionException("Permission denied: must logged in as applicant")
    db.session.delete(application)
    db.session.commit()
    return MyResponse().build()
