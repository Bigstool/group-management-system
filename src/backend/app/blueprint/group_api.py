import time
import uuid

from flask import Blueprint, request
from sqlalchemy import and_
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Notification import Notification
from model.Group import Group
from model.Semester import Semester
from model.User import User
from model.GroupApplication import GroupApplication
from model.GroupComment import GroupComment
from model.GroupFavorite import GroupFavorite
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
group_api = Blueprint("group_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@group_api.route("/group", methods=["POST"])
def create_group():
    """Create a new group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be user
      * operator must have no created group or joined group
      * must before grouping ddl
      * application made by user is deleted after group creation

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                description: group name
                example: Jaxzefalk
                max: 256
              title:
                type: string
                description: group project title
                example: Group Management System
                max: 256
              description:
                type: string
                max: 4096
                description: group description
                example: Developing a group management system for CPT202
              proposal:
                type: string
                description: group proposal
                max: 4096
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac. Mauris tortor massa, ultrices ac lectus at, vestibulum condimentum ex. Etiam varius, neque ac fringilla sodales, libero dolor molestie risus, vitae placerat nisi augue quis tellus. Cras mollis semper lacus, vitae consequat libero venenatis eget. Maecenas semper ante urna, et vulputate lorem viverra in. Nunc non turpis nec erat interdum sodales sit amet quis ex. Fusce sit amet ante eget leo luctus fermentum in volutpat eros. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi vel blandit erat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            required:
              - name
              - title
              - description

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
        "title": fields.Str(required=True, validate=validate.Length(min=1, max=256)),
        "description": fields.Str(required=True, validate=validate.Length(min=1, max=4096)),
        "proposal": fields.Str(missing=None, validate=validate.Length(max=4096))
    }, request, location="json")
    name: str = args_json["name"]
    title: str = args_json["title"]
    description: str = args_json["description"]
    proposal: str = args_json["proposal"]

    token_info = Auth.get_payload(request)

    # check grouping ddl
    system_config = Semester.query.filter_by(name="CURRENT").first().config
    if system_config["system_state"]["grouping_ddl"] < time.time():
        raise ApiPermissionException("Permission denied: Grouping is finished, you cannot create a new group!")

    # check operator role
    if token_info["role"] == "ADMIN":
        raise ApiPermissionException("Permission denied: must logged in as USER")

    user = User.query.filter_by(uuid=uuid.UUID(token_info['uuid']).bytes).first()
    if user.owned_group is not None or user.joined_group is not None:
        raise ApiPermissionException(f'Permission denied: you belong to one group, you cannot create a new group!')

    # create a new group
    new_group = Group(uuid=uuid.uuid4().bytes,
                      name=name,
                      title=title,
                      description=description,
                      proposal=proposal,
                      proposal_update_time=proposal and int(time.time()),
                      proposal_state='PENDING',
                      creation_time=int(time.time()),
                      owner_uuid=uuid.UUID(token_info['uuid']).bytes)

    db.session.add(new_group)

    # delete all user applications
    GroupApplication.query.filter_by(applicant_uuid=user.uuid).delete()

    db.session.commit()

    return MyResponse().build()


@group_api.route("/group", methods=["GET"])
def get_group_list():
    """Get list of group
    ---
    tags:
      - group

    description: |

    parameters:
      - name: semester
        in: query
        default: "CURRENT"
        description: semester filter
        schema:
          type: string
          example: "2021-S2"

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
                    description: group uuid
                    example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                  favorite:
                    type: bool
                    description: whether the group is starred by the user
                    example: true
                  name:
                    type: string
                    description: group name
                    example: Jaxzefalk
                  title:
                    type: string
                    description: group project title
                    example: Group Management System
                  description:
                    type: string
                    description: group description
                    example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                  owner:
                    type: object
                    description: the user who created the group
                    properties:
                      alias:
                        type: string
                        example: Ming Li
                      email:
                        type: string
                        example: Ming.Li@example.com
                  creation_time:
                    type: integer
                    description: group creation time, unix timestamp
                    example: 1617189103
                  member_count:
                    type: integer
                    description: count of joined members
                    example: 4
                  proposal_state:
                    type: string
                    description: state of group submission
                    enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECT"]
                    example: PENDING
                  proposal_late:
                    type: number
                    description: |
                      late submission duration in seconds

                      timestamp(latest PENDING -> COMMIT operation) - timestamp(GROUPING DDL)

                      negative number is possible because of submitted prior to the DDL

                      unit: second
                    example: 7485
                  application_enabled:
                    type: boolean
                    description: whether this group accept new application
                    example: true
    """
    args_query = parser.parse({
        "semester": fields.Str(missing="CURRENT")
    }, request, location="query")
    semester_filter: str = args_query["semester"]

    token_info = Auth.get_payload(request)

    semester = Semester.query.filter_by(name=semester_filter).first()

    group_list = Group.query.filter(
        Group.creation_time.between(semester.start_time, semester.end_time or time.time())).all()


    return MyResponse(data=[{
            "uuid": str(uuid.UUID(bytes=group.uuid)),
            "favorite": semester.name == "CURRENT" and bool(
            GroupFavorite.query.filter_by(group_uuid=group.uuid, user_uuid=uuid.UUID(token_info["uuid"]).bytes).first()),
            "name": group.name,
            "title": group.title,
            "description": group.description,
            "owner": {
                "uuid": str(uuid.UUID(bytes=group.owner_uuid)),
                "alias": group.owner.alias,
                "email": group.owner.email
            },
            "creation_time": group.creation_time,
            "proposal_state": group.proposal_state,
            "proposal_late": group.proposal_late,
            "member_count": len(group.member),
            "application_enabled": group.application_enabled
        } for group in group_list]).build()


@group_api.route("/group/<group_uuid>", methods=["GET"])
def get_group_info(group_uuid):
    """Get detail info of the group
    ---
    tags:
      - group

    description: |

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
              type: object
              properties:
                favorite:
                  type: bool
                  description: whether the group is starred by the user
                  example: true
                name:
                  type: string
                  description: group name
                  example: Jaxzefalk
                title:
                  type: string
                  description: group project title
                  example: Group Management System
                description:
                  type: string
                  description: group description
                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                owner:
                  type: object
                  description: the user who created the group
                  properties:
                    uuid:
                      type: string
                      description: user uuid
                      example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
                    alias:
                      type: string
                      example: Ming Li
                    email:
                      type: string
                      example: Ming.Li@example.com
                    role:
                      type: string
                      example: "ADMIN"
                      enum: ["ADMIN", "USER"]
                proposal:
                  type: string
                  description: group proposal
                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                proposal_update_time:
                  type: number
                  example: 1617189103
                  description: unix timestamp of last proposal update time
                proposal_state:
                  type: string
                  description: state of group submission
                  enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECT"]
                  example: PENDING
                proposal_late:
                  type: number
                  description: |
                    late submission duration in seconds

                    timestamp(latest PENDING -> COMMIT operation) - timestamp(GROUPING DDL)

                    negative number is possible because of submitted prior to the DDL
                    
                    unit: second
                  example: 7485
                member:
                  type: array
                  items:
                    type: object
                    description: the user who has joined the group
                    properties:
                      uuid:
                        type: string
                        description: user uuid
                        example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
                      alias:
                        type: string
                        example: Ming Li
                      email:
                        type: string
                        example: Ming.Li@example.com
                application_enabled:
                  type: boolean
                  description: whether this group accept new application
                  example: true
                comment:
                  type: array
                  items:
                    type: object
                    properties:
                      creation_time:
                        type: number
                        description: unix timestamp of comment creation time
                        example: 1618847321
                      content:
                        type: string
                        description: comment for the group proposal
                        example: This is the lamest idea I've ever heard. Boo~
                      author:
                        type: object
                        description: the user who made the comment
                        properties:
                          uuid:
                            type: string
                            description: user uuid
                            example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
                          alias:
                            type: string
                            example: Ming Li
                          email:
                            type: string
                            example: Ming.Li@example.com
                creation_time:
                  type: integer
                  description: group creation time, unix timestamp
                  example: 1617189103
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_path["group_uuid"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)
    if group is None:
        raise ApiResourceNotFoundException('Not found: No such group!')

    return MyResponse(data={
        "favorite": bool(GroupFavorite.query.filter_by(user_uuid=uuid.UUID(token_info["uuid"]).bytes,
                                                       group_uuid=group.uuid).first()),
        "name": group.name,
        "title": group.title,
        "description": group.description,
        "proposal": group.proposal,
        "owner": {
            'uuid': str(uuid.UUID(bytes=group.owner_uuid)),
            'alias': group.owner.alias,
            'email': group.owner.email
        },
        "proposal_state": group.proposal_state,
        "proposal_update_time": group.proposal_update_time,
        "proposal_late": group.proposal_late,
        "member": [{
            "uuid": str(uuid.UUID(bytes=member.uuid)),
            "alias": member.alias,
            "email": member.email
        } for member in group.member],
        "application_enabled": group.application_enabled,
        "comment": [{
            "content": comment.content,
            "author": {
                "uuid": str(uuid.UUID(bytes=comment.author.uuid)),
                "alias": comment.author.alias,
                "email": comment.author.email,
                "role": comment.author.role
            },
            "creation_time": comment.creation_time
        } for comment in group.comment],
        "creation_time": group.creation_time
    }).build()


@group_api.route("/group/<group_uuid>", methods=["PATCH"])
def update_group_info(group_uuid):
    """Update information of the group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be group owner / admin
      * if operator not admin, then name/description/proposal/owner_uuid/application_enabled can be changed if system state is GROUPING/PROPOSING and proposal_state is PENDING
      * owner_uuid must be one of group member uuid
      * refer to late-submission-states.jpg in /docs for proposal_state constrains
      * group owner cannot change proposal state if proposal has not been set

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
              name:
                type: string
                description: new group name
                example: Jaxzefalk
                max: 256
              title:
                type: string
                description: new group project title
                example: Group Management System
                max: 256
              description:
                type: string
                description: new group description
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis.
                max: 4096
              proposal:
                type: string
                description: new group proposal
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis.
                max: 4096
              proposal_state:
                type: string
                description: new state of group submission
                enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECT"]
                example: SUBMITTED
              application_enabled:
                type: boolean
                description: whether this group accept new application
                example: true
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
        "name": fields.Str(missing=None, validate=validate.Length(min=1, max=256)),
        "title": fields.Str(missing=None, validate=validate.Length(min=1, max=256)),
        "description": fields.Str(missing=None, validate=validate.Length(min=1, max=4096)),
        "proposal": fields.Str(missing=None, validate=validate.Length(max=4096)),
        "proposal_state": fields.Str(missing=None,
                                     validate=validate.OneOf(["PENDING", "SUBMITTED", "APPROVED", "REJECT"])),
        "application_enabled": fields.Boolean(missing=None)
    }, request, location="json")
    group_uuid: str = args_path["group_uuid"]
    new_name: str = args_json["name"]
    new_title: str = args_json["title"]
    new_description: str = args_json["description"]
    new_proposal: str = args_json["proposal"]
    new_proposal_state: str = args_json["proposal_state"]
    new_application_enabled: bool = args_json["application_enabled"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)
    if group is None:
        raise ApiResourceNotFoundException("No such group!")

    semester = Semester.query.filter_by(name="CURRENT").first()

    if token_info["role"] != "ADMIN" and token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid)):
        raise ApiPermissionException("Permission denied: Not logged in as group owner")

    if token_info["role"] != "ADMIN":
        # Constrains for the group owner
        if time.time() > semester.config["system_state"]['proposal_ddl']:
            raise ApiPermissionException("Permission denied: Proposal ddl reached")
        if group.proposal_state == "APPROVED":
            raise ApiPermissionException("Permission denied: Proposal is APPROVED")
        if new_proposal_state == 'APPROVED':
            raise ApiPermissionException("Permission denied: Not logged in as ADMIN")

    if new_name is not None:
        group.name = new_name
    if new_title is not None:
        group.title = new_title
    if new_description is not None:
        group.description = new_description
    if new_proposal is not None:
        group.proposal = new_proposal
        group.proposal_update_time = int(time.time())
    if new_proposal_state is not None:
        # proposal state can be changed only if the proposal is not none
        if group.proposal == None:
            raise ApiInvalidInputException("Invalid input: Proposal empty")
        # calculate late submission
        if group.proposal_state == "PENDING" and \
                new_proposal_state == "SUBMITTED" and \
                time.time() > semester.config["system_state"]['proposal_ddl']:
            group.proposal_late = time.time() - semester.config["system_state"]['proposal_ddl']
        group.proposal_state = new_proposal_state
    if new_application_enabled is not None:
        group.application_enabled = new_application_enabled

    db.session.commit()
    return MyResponse().build()


@group_api.route("/group/<group_uuid>/owner", methods=["PATCH"])
def transfer_group_ownership(group_uuid):
    """
    Transfer ownership of the group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be group owner / admin
      * new owner must be one of the group member

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
              owner_uuid:
                type: string
                description: uuid of the new group owner
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
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    args_json = parser.parse({
        "owner_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="json")
    group_uuid: str = args_path["group_uuid"]
    new_owner_uuid: str = args_json["owner_uuid"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)

    if group is None:
        raise ApiResourceNotFoundException("Not found: invalid group uuid")

    if token_info["role"] != "ADMIN" and token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid)):
        raise ApiPermissionException("Permission denied: must log in as group owner")

    new_owner = next((member for member in group.member if member.uuid == uuid.UUID(new_owner_uuid).bytes), None)
    if not new_owner:
        raise ApiInvalidInputException("Invalid input: new owner must be member of group")

    # Transfer owner
    old_owner: User = User.query.get(group.owner_uuid)
    old_owner.joined_group_uuid = group.uuid
    group.owner_uuid = new_owner.uuid
    new_owner.joined_group_uuid = None

    # Notify members
    for receiver in group.member:
        db.session.add(Notification(uuid=uuid.uuid4().bytes,
                                    user_uuid=receiver.uuid,
                                    title="Group Owner Changed",
                                    content=f"{new_owner.alias} has become the owner of group {group.name}",
                                    creation_time=int(time.time())))

    db.session.commit()

    return MyResponse().build()


@group_api.route("/group/<group_uuid>", methods=["DELETE"])
def delete_group(group_uuid):
    """Delete a group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be group owner / admin
      * if operator not admin, then group can only be deleted if system state is GROUPING

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
              type: object
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_path["group_uuid"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)
    if group is None:
        raise ApiResourceNotFoundException("Not found: invalid group uuid")

    semester = Semester.query.filter_by(name="CURRENT").first()

    if token_info["role"] != "ADMIN" and token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid)):
        raise ApiPermissionException("Permission denied: must logged in as group owner or ADMIN")
    if token_info["role"] != "ADMIN" and time.time() > semester.config["system_state"]["grouping_ddl"]:
        raise ApiPermissionException("Permission denied: grouping ddl reached")

    # Notification for members
    for member in group.member:
        new_notification = Notification(uuid=uuid.uuid4().bytes,
                                        user_uuid=member.uuid,
                                        title="Group dismissed",
                                        content=f"Group {group.name} has been dismissed",
                                        creation_time=int(time.time()))
        db.session.add(new_notification)

    db.session.delete(group)
    db.session.commit()

    return MyResponse().build()


@group_api.route("/group/<group_uuid>/member/<user_uuid>", methods=["DELETE"])
def remove_member(group_uuid, user_uuid):
    """Remove the member from group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be the group member / group owner

    parameters:
      - name: group_uuid
        in: path
        required: true
        description: group uuid
        schema:
          type: string
          example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
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
              type: object
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid()),
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_path["group_uuid"]
    user_uuid: str = args_path["user_uuid"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)
    if group is None:
        raise ApiResourceNotFoundException("Not found: no such group")
    user = User.query.get(uuid.UUID(user_uuid).bytes)
    if user is None:
        raise ApiResourceNotFoundException("Not found: no such user")
    if user.uuid not in [member.uuid for member in group.member]:
        raise ApiResourceNotFoundException("Not found: user not a group member")

    # Check Identity
    if token_info["role"] != "ADMIN" and \
            token_info["uuid"] != str(uuid.UUID(bytes=group.owner_uuid)) and \
            token_info["uuid"] != user_uuid:
        raise ApiPermissionException("Permission denied: Must be the member or group owner")

    user.joined_group_uuid = None

    if (token_info["uuid"] == user_uuid):
        # Notify the group owner and other member
        for receiver_uuid in [group.owner_uuid] + [member.uuid for member in group.member if member.uuid != user.uuid]:
            db.session.add(Notification(uuid=uuid.uuid4().bytes,
                                        user_uuid=receiver_uuid,
                                        title="Member Left",
                                        content=f"Group member {user.alias} has left the group {group.name}",
                                        creation_time=int(time.time())))
    else:
        # Notify the removed member
        db.session.add(Notification(uuid=uuid.uuid4().bytes,
                                    user_uuid=user.uuid,
                                    title="Removed From Group",
                                    content=f"You have been removed from the group {group.name}",
                                    creation_time=int(time.time())))
        # Notify other member
        for receiver_uuid in [member.uuid for member in group.member if member.uuid != user.uuid]:
            db.session.add(Notification(uuid=uuid.uuid4().bytes,
                                        user_uuid=receiver_uuid,
                                        title="Member Removed",
                                        content=f"{user.alias} has been removed from the group {group.name}",
                                        creation_time=int(time.time())))

    db.session.commit()
    return MyResponse().build()


@group_api.route("/group/merged", methods=["POST"])
def merge_group():
    """Merge a group to another
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be group owner / admin
      * if operator not admin, then group can only be merged if system state is GROUPING

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              source_group_uuid:
                type: string
                description: the group uuid of whom to be merged
                example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
              target_group_uuid:
                type: string
                description: the uuid of the target group to join
                example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb

    responses:
      200:
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    raise ApiUnimplementedException("Unimplemented")  # TODO


@group_api.route("/group/<group_uuid>/favorite", methods=["POST"])
def favorite_group(group_uuid):
    """Favorite a group
    ---
    tags:
      - group

    description: |

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
              type: object
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_path["group_uuid"]

    token_info = Auth.get_payload(request)

    favorite = GroupFavorite.query.filter_by(user_uuid=uuid.UUID(token_info["uuid"]).bytes,
                                             group_uuid=uuid.UUID(group_uuid).bytes).first()

    if favorite is None:
        db.session.add(GroupFavorite(uuid=uuid.uuid4().bytes,
                                     user_uuid=uuid.UUID(token_info["uuid"]).bytes,
                                     group_uuid=uuid.UUID(group_uuid).bytes))
        db.session.commit()

    return MyResponse().build()


@group_api.route("/group/<group_uuid>/favorite", methods=["DELETE"])
def undo_favorite_group(group_uuid):
    """Undo favorite a group
        ---
        tags:
          - group

        description: |

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
                  type: object
        """

    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_path["group_uuid"]

    token_info = Auth.get_payload(request)

    favorite = GroupFavorite.query.filter_by(user_uuid=uuid.UUID(token_info["uuid"]).bytes,
                                             group_uuid=uuid.UUID(group_uuid).bytes).first()
    if favorite is not None:
        db.session.delete(favorite)
        db.session.commit()

    return MyResponse().build()


@group_api.route("/group/<group_uuid>/comment", methods=["POST"])
def add_comment(group_uuid):
    """Add a comment to group
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be group member / group owner / admin

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
              content:
                type: string
                description: comment content
                max: 4096
                example: Good idea!

    responses:
      200:
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    args_json = parser.parse({
        "content": fields.Str(required=True, validate=validate.Length(min=1, max=4096))}, request, location="json")
    group_uuid: str = args_path["group_uuid"]
    content: str = args_json["content"]

    token_info = Auth.get_payload(request)

    group = Group.query.get(uuid.UUID(group_uuid).bytes)

    if token_info["role"] != "ADMIN" and \
            uuid.UUID(token_info["uuid"]).bytes not in [group.owner_uuid] + [member.uuid for member in group.member]:
        raise ApiPermissionException(
            "Permission denied: you must be admin, group owner or group member to make a comment")

    new_comment = GroupComment(uuid=uuid.uuid4().bytes,
                               creation_time=int(time.time()),
                               author_uuid=uuid.UUID(token_info["uuid"]).bytes,
                               group_uuid=uuid.UUID(group_uuid).bytes,
                               content=content)
    db.session.add(new_comment)
    db.session.commit()

    return MyResponse().build()


@group_api.route("/group/assigned", methods=["POST"])
def assign_group():
    """
    Create a new group and assign member
    ---
    tags:
      - group

    description: |
      ## Constrains
      * operator must be admin
      * member must has no previous joined group or created group

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
                description: group name
                example: Jaxzefalk
                max: 256
              title:
                type: string
                description: group project title
                example: Group Management System
                max: 256
              description:
                type: string
                max: 4096
                description: group description
                example: Developing a group management system for CPT202
              owner_uuid:
                type: string
                description: user uuid
                example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
              member_uuid:
                type: array
                items:
                  type: string
                  description: user uuid
                  example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
            required:
              - name
              - title
              - description
              - owner_uuid

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
        "title": fields.Str(required=True, validate=validate.Length(min=1, max=256)),
        "description": fields.Str(required=True, validate=validate.Length(min=1, max=4096)),
        "owner_uuid": fields.Str(required=True, validate=MyValidator.Uuid()),
        "member_uuid": fields.List(fields.Str(validate=MyValidator.Uuid()))
    }, request, location="json")
    name: str = args_json["name"]
    title: str = args_json["title"]
    description: str = args_json["description"]
    owner_uuid: str = args_json["owner_uuid"]
    member_uuid: list = args_json["member_uuid"]

    token_info = Auth.get_payload(request)

    # check operator role
    if token_info["role"] != "ADMIN":
        raise ApiPermissionException("Permission denied: must logged in as ADMIN")

    # create a new group
    owner: User = User.query.get(uuid.UUID(owner_uuid).bytes)
    if owner is None:
        raise ApiResourceNotFoundException("Not found: invalid owner_uuid")
    if owner.joined_group or owner.owned_group:
        raise ApiInvalidInputException("Invalid input: specified owner already has joined group or created group")

    new_group_uuid = uuid.uuid4().bytes
    db.session.add(Group(uuid=new_group_uuid,
                         name=name,
                         title=title,
                         description=description,
                         proposal_state='PENDING',
                         creation_time=int(time.time()),
                         owner_uuid=owner.uuid))
    # Notify user
    db.session.add(Notification(
        uuid=uuid.uuid4().bytes,
        user_uuid=owner.uuid,
        title="New group",
        content=f"You have been designated as owner of group {name}",
        creation_time=int(time.time())
    ))

    # add members
    for user_uuid in member_uuid:
        user = User.query.get(uuid.UUID(user_uuid).bytes)
        if user is None:
            raise ApiResourceNotFoundException(f"Not found: member uuid {user_uuid} is invalid")

        user.joined_group_uuid = new_group_uuid
        # delete all user applications
        GroupApplication.query.filter_by(applicant_uuid=user.uuid).delete()
        # Notify user
        db.session.add(Notification(
            uuid=uuid.uuid4().bytes,
            user_uuid=user.uuid,
            title="New group",
            content=f"You have been assigned to group {name}",
            creation_time=int(time.time())
        ))

    db.session.commit()
    return MyResponse().build()
