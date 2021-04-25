import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from webargs import fields, validate
from webargs.flaskparser import parser

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
              - description

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    # check constrains
    # system_state = SystemConfig.query.first().conf
    # if system_state['system_state'] != "GROUPING":
    #     raise ApiPermissionException("Permission denied: Grouping is finished, you cannot create a new group!")

    args_json = parser.parse({
        "name": fields.Str(required=True, validate=validate.Length(max=256)),
        "description": fields.Str(required=True, validate=validate.Length(max=4096)),
        "proposal": fields.Str(missing=None, validate=validate.Length(max=4096))
    }, request, location="json")
    name: str = args_json["name"].lower()
    description: str = args_json["description"]
    proposal: str = args_json["proposal"]

    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']

    if token_info["role"] == "ADMIN":
        raise ApiPermissionException(
            f"Permission denied: must logged in as USER"
        )

    user = User.query.filter_by(uuid=uuid.UUID(uuid_in_token).bytes).first()
    if user.group_id is not None:
        raise ApiPermissionException(
            f'Permission denied: you are in group {user.group_id}, you cannot create a new group!')

    # create a new group
    new_group = Group(uuid=uuid.uuid4().bytes,
                      name=name,
                      description=description,
                      proposal=proposal,
                      proposal_state='PENDING',
                      creation_time=int(time.time()),
                      owner_uuid=uuid.UUID(uuid_in_token).bytes)
    # update User db
    user.group_id = new_group.uuid

    db.session.add(new_group)
    db.session.commit()
    return MyResponse(data=None).build()


@group_api.route("/group", methods=["GET"])
def get_group_list():
    """Get list of group
    ---
    tags:
      - group

    description: |

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
                  application_enable:
                    type: boolean
                    description: whether this group accept new application
                    example: true
    """
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']

    data = Group.query.all()
    data_list = []
    for group in data:
        if GroupFavorite.query.filter_by(uuid=group.uuid, user_uuid=uuid.UUID(uuid_in_token).bytes).first():
            favorite = True
        else:
            favorite = False
        user = User.query.filter_by(uuid=group.owner_uuid).first()
        data_list.append({"uuid": str(uuid.UUID(bytes=group.uuid)),
                          "favorite": favorite,
                          "name": group.name,
                          "description": group.description,
                          "owner": {"alias": user.alias, "email": user.email},
                          "creation_time": group.creation_time, "member_count": group.member_num,
                          "application_enabled": group.application_enabled})

    return MyResponse(data=data_list).build()


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
    args_query = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_query["group_uuid"]

    group = Group.query.filter_by(uuid=uuid.UUID(group_uuid).bytes).first()
    if group is None:
        raise ApiResourceNotFoundException('Not found: No such group!')

    # favorite info
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    favorite_group_list = GroupFavorite.query.filter_by(user_uuid=uuid.UUID(uuid_in_token).bytes).all()
    favorite = False
    for fav_group in favorite_group_list:
        if fav_group.group_uuid == group.uuid:
            favorite = True
            break

    # owner info
    owner = User.query.filter_by(uuid=group.owner_uuid).first()

    # member_list info
    members = User.query.filter_by(group_id=group.uuid).all()
    member_list = []
    for member in members:
        member_list.append({'uuid': str(uuid.UUID(bytes=member.uuid)), 'alias': member.alias, 'email': member.email})

    # comment info
    comments = GroupComment.query.filter_by(group_uuid=group.uuid).all()
    comment_list = []
    for comment in comments:
        author = User.query.filter_by(uuid=comment.author_uuid).first()
        comment_list.append({'content': comment.content,
                             'author': {'uuid': str(uuid.UUID(bytes=author.uuid)), 'alias': author.alias,
                                        'email': author.email},
                             'creation_time': comment.creation_time})

    return MyResponse(data={
        "favorite": favorite,
        "name": group.name,
        "description": group.description,
        "proposal": group.proposal,
        "owner": {'uuid': str(uuid.UUID(bytes=group.owner_uuid)), 'alias': owner.alias, 'email': owner.email},
        "proposal_state": group.proposal_state,
        "proposal_late": group.proposal_late,
        "member": member_list,
        "application_enabled": group.application_enabled,
        "comment": comment_list,
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
              description:
                type: string
                description: new group description
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis.
              owner_uuid:
                type: string
                description: new group owner uuid
              proposal:
                type: string
                description: new group proposal
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis.
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
        "name": fields.Str(missing=None, validate=validate.Length(max=30)),
        "description": fields.Str(missing=None, validate=validate.Length(max=1000)),
        "owner_uuid": fields.Str(missing=None, validate=validate.Length(max=50)),
        "proposal": fields.Str(missing=None, validate=validate.Length(max=2000)),
        "proposal_state": fields.Str(missing=None, validate=validate.OneOf(
            ["PENDING", "SUBMITTED", "APPROVED", "REJECT"])),
        "application_enabled": fields.Boolean(missing=None)
    }, request, location="json")
    group_uuid: str = args_path["group_uuid"]
    new_name: str = args_json["name"]
    new_description: str = args_json["description"]
    new_owner_uuid: str = args_json["owner_uuid"]
    new_proposal: str = args_json["proposal"]
    new_proposal_state: str = args_json["proposal_state"]
    new_application_enabled: bool = args_json["application_enabled"]

    group = Group.query.filter_by(uuid=uuid.UUID(group_uuid).bytes).first()
    if group is None:
        raise ApiResourceNotFoundException("No such group!")
    system_state = Semester.query.first().conf['system_state']
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    if not (token_info["role"] == "ADMIN" or uuid_in_token == str(uuid.UUID(bytes=group.owner_uuid))):
        raise ApiPermissionException("You have no permission to update information of this group!")
    if uuid_in_token == str(uuid.UUID(bytes=group.owner_uuid)):
        #Constrains for the group owner
        if (time.time() > system_state['proposing_ddl']):
            raise ApiPermissionException(
                "Grouping or proposing activity is finished, you cannot change your group information. ")
        if group.proposal_state == "Approved":
            raise ApiPermissionException(
                "Your proposal has been approved. You cannot change group information anymore.")
        if new_proposal_state=='Approved':
            raise ApiPermissionException(
                "You are not admin and you cannot approve the proposal! ")

    if new_name is not None:
        group.name = new_name
    if new_description is not None:
        group.description = new_description
    if new_owner_uuid is not None:
        new_owner = User.query.filter_by(uuid=uuid.UUID(new_owner_uuid).bytes).first()
        if new_owner is None:
            raise ApiInvalidInputException("You might typed in a wrong new_owner, please check and try again!")
        if new_owner.group_id is None or str(uuid.UUID(bytes=new_owner.group_id)) != group_uuid:
            raise ApiPermissionException("The new owner of this group should be your group member!")
        group.owner_uuid = uuid.UUID(new_owner_uuid).bytes
    if new_proposal is not None:
        group.proposal = new_proposal
    if new_proposal_state is not None:
        if group.proposal == None:
            #This ensures that the proposal state can be changed only if the proposal is not none
            raise ApiInvalidInputException("You cannot change the proposal state since there isn't any proposal yet.")
        if group.proposal_state=="PENDING" and new_proposal_state=="SUBMITTED":
            if time.time()>system_state['proposing_ddl']:
                group.proposal_late=time.time()-system_state['proposing_ddl']
        group.proposal_state = new_proposal_state
    if new_application_enabled is not None:
        group.application_enabled = new_application_enabled
    db.session.commit()
    return MyResponse(data=None, msg='query success').build()


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
    group = Group.query.filter_by(uuid=uuid.UUID(group_uuid).bytes).first()
    if group is None:
        raise ApiResourceNotFoundException("No such group!")
    system_state = SystemConfig.query.first().conf['system_state']
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    if not (token_info["role"] == "ADMIN" or uuid_in_token == str(uuid.UUID(bytes=group.owner_uuid))):
        raise ApiPermissionException("You have no permission to delete this group!")
    if uuid_in_token == str(uuid.UUID(bytes=group.owner_uuid)):
        # Constrains for the group owner
        if (time.time() > system_state['grouping_ddl']):
            raise ApiPermissionException(
                "Grouping activity is finished, you cannot delete your group. ")
    group_application=GroupApplication.query.filter_by(group_uuid=uuid.UUID(group_uuid).bytes).all()
    for application in group_application:
        db.session.delete(application)
    group_comment = GroupComment.query.filter_by(group_uuid=uuid.UUID(group_uuid).bytes).all()
    for comment in group_comment:
        db.session.delete(comment)
    group_Favorite = GroupFavorite.query.filter_by(group_uuid=uuid.UUID(group_uuid).bytes).all()
    for favorite in group_Favorite:
        db.session.delete(favorite)
    db.session.delete(group)
    db.session.commit()
    return MyResponse(data=None).build()





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
    pass  # TODO


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
    pass  # TODO


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
    # add a error report?
    args_query = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_query["group_uuid"]

    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    user = User.query.filter_by(uuid=uuid.UUID(uuid_in_token).bytes).first()

    new_favorite = GroupFavorite(uuid=uuid.uuid4().bytes,
                                 user_uuid=user.uuid,
                                 group_uuid=uuid.UUID(group_uuid).bytes)

    db.session.add(new_favorite)
    db.session.commit()
    return MyResponse(data=None).build()


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
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info["uuid"]

    args_query = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_query["group_uuid"]

    favorite_groups_by_user = GroupFavorite.query.filter_by(user_uuid=uuid.UUID(uuid_in_token).bytes).all()
    undo_group = None
    for group in favorite_groups_by_user:
        if group.group_uuid == uuid.UUID(group_uuid).bytes:
            undo_group = group
    if undo_group is None:
        raise ApiResourceNotFoundException("Not found: you cannot undo the favorite to this group!")

    db.session.delete(undo_group)
    db.session.commit()

    return MyResponse(data=None).build()


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
    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']
    user = User.query.filter_by(uuid=uuid.UUID(uuid_in_token).bytes).first()

    args_query = parser.parse({
        "group_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")
    group_uuid: str = args_query["group_uuid"]

    if user.group_id != uuid.UUID(group_uuid).bytes and token_info["role"] != "ADMIN":
        raise ApiPermissionException(
            "Permission denied: you must be admin, group owner or group member to make a comment")

    args_json = parser.parse({
        "content": fields.Str(required=True, validate=validate.Length(max=4096))}, request, location="json")
    content: str = args_json["content"]

    new_comment = GroupComment(uuid=uuid.uuid4().bytes,
                               creation_time=int(time.time()),
                               author_uuid=user.uuid,
                               group_uuid=user.group_id,
                               content=content)
    db.session.add(new_comment)
    db.session.commit()

    return MyResponse(data=None).build()
