import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from webargs import fields, validate
from webargs.flaskparser import parser

from model.User import User
from shared import get_logger, db
from utility import MyValidator
from utility.ApiException import *
from utility.Auth import Auth
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
user_api = Blueprint("user_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@user_api.route("/user", methods=["POST"])
def create_user():
    """
    Create a new user
    ---
    tags:
      - user

    description: |
      ## Constrains
      * operator must be admin
      * email must be unique

    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
                description: user email
                example: jeff.dean@internet.com
              alias:
                type: string
                min: 4
                max: 32
                description: user alias
                example: Jeff Dean
              password:
                type: string
                description: sha1(password)
                example: 5F4DCC3B5AA765D61D8327DEB882CF99
            required:
              - email
              - password

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_json = parser.parse({
        "email": fields.Str(required=True, validate=validate.Email()),
        "alias": fields.Str(missing=None, validate=validate.Length(min=4, max=32)),
        "password": fields.Str(required=True, validate=MyValidator.Sha1())
    }, request, location="json")

    email: str = args_json["email"].lower()
    alias: str = args_json["alias"]
    password: str = args_json["password"]

    # # limit access to admin only
    # user_info = Auth.get_payload(request)
    # if user_info["uuid"] != "0":
    #     raise ApiPermissionException("Permission denied: not logged in as admin")

    # check duplicate email
    old_user = User.query.filter_by(email=email).first()
    if old_user is not None:
        raise ApiDuplicateResourceException(f"Conflict: a user with the email already exists")

    # Generate password
    password_salt = secrets.token_bytes(16)
    password_hash = hmac.new(password_salt, bytes.fromhex(password), "sha1").digest()
    new_user = User(uuid=uuid.uuid4().bytes,
                    email=email,
                    alias=alias,
                    password_salt=password_salt,
                    password_hash=password_hash,
                    creation_time=int(time.time()))
    db.session.add(new_user)
    db.session.commit()
    return MyResponse(data=None).build()


@user_api.route("/user/<user_uuid>", methods=["GET"])
def get_user_profile(user_uuid):
    """Get profile of the user
    ---
    tags:
      - user

    description: |

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
              type: object
              properties:
                email:
                  type: string
                  description: user email
                  example: jeff.dean@internet.com
                alias:
                  type: string
                  description: user alias
                  example: Jeff Dean
                bio:
                  type: string
                  description: user bio
                  example: I write O(1/n) algorithms
                joined_group:
                  type: object
                  properties:
                    uuid:
                      type: string
                      description: group uuid
                      example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                    name:
                      type: string
                      description: group name
                      example: Jaxzefalk
                    description:
                      type: string
                      description: group description
                      example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                created_group:
                  type: object
                  properties:
                    uuid:
                      type: string
                      description: group uuid
                      example: b86a6406-14ca-4459-80ea-c0190fc43bd3
                    name:
                      type: string
                      description: group name
                      example: Jaxzefalk
                    description:
                      type: string
                      description: group description
                      example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    """
    args_query = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="path")

    user_uuid: str = args_query["user_uuid"]

    user = User.query.filter_by(uuid=uuid.UUID(user_uuid).bytes).first()

    # TODO complete Leo
    if user is None:
        raise ApiResourceNotFoundException("Not found: invalid user uuid")

    # TODO complete Leo
    group =user.group

    if group is None:
        return MyResponse(data={
            "alias": user.alias,
            "email": user.email,
            "bio": user.bio,
            "created_group":None,
            "joined_group:":None
        }).build()
    elif group.owner_uuid==uuid.UUID(user_uuid).bytes:
        return MyResponse(data={
            "alias": user.alias,
            "email": user.email,
            "bio": user.bio,
            "created_group": {"uuid":str(uuid.UUID(bytes=group.uuid)),"name":group.name, "description":group.description},
            "joined_group:": None
        }).build()
    else:
        return MyResponse(data={
            "alias": user.alias,
            "email": user.email,
            "bio": user.bio,
            "created_group": None,
            "joined_group:": {"uuid": group.uuid, "name": group.name, "description": group.description}
        }).build()

@user_api.route("/user/<user_uuid>", methods=["PATCH"])
def update_user_profile(user_uuid):
    """Update profile of the user
    ---
    tags:
      - user

    description: |
      ## Constrains
      * operator must be the user to be modified

    parameters:
      - name: user_uuid
        in: path
        required: true
        description: user uuid
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
              # email:
              #   type: string
              #   description: user email
              #   example: jeff.dean@internet.com
              # alias:
              #   type: string
              #   description: user alias
              #   example: Jeff Dean
              bio:
                type: string
                description: user bio
                example: I write O(1/n) algorithms

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    args_path = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")

    args_json = parser.parse({
        # "email": fields.Str(missing=None, validate=validate.Email()),
        # "alias": fields.Str(missing=None, validate=validate.Length(min=4, max=32)),
        "bio": fields.Str(missing=None, validate=validate.Length(max=1000))
    }, request, location="json")

    user_uuid: str = args_path["user_uuid"]
    # new_email: str = args_json["email"]
    # new_alias: str = args_json["alias"]
    new_bio: str = args_json["bio"]

    token_info = Auth.get_payload(request)
    uuid_in_token = token_info['uuid']

    if (user_uuid != uuid_in_token):
        raise ApiPermissionException('Permission denied: you cannot update other user\'s profile!')

    user = User.query.filter_by(uuid=uuid.UUID(uuid_in_token).bytes).first()

    if user is None:
        logger.debug(f"Update fail: no such user")
        raise ApiPermissionException("Permission denied: invalid credential")
    # if new_email is not None:
    #     user.email = new_email
    # if new_alias is not None:
    #     user.alias = new_alias
    if new_bio is not None:
        user.bio = new_bio
    db.session.commit()

    return MyResponse(data=None, msg='query success').build()
