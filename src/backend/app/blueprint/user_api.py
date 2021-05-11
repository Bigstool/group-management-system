import hashlib
import hmac
import random
import secrets
import string
import time
import uuid

from flask import Blueprint, request
from marshmallow import Schema
from webargs import fields, validate
from webargs.flaskparser import parser, use_args

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


class UserSchema(Schema):
    email = fields.Str(required=True, validate=validate.Email())
    alias = fields.Str(missing=None, validate=validate.Length(min=4, max=32))


@user_api.route("/user", methods=["POST"])
@use_args(UserSchema(many=True))
def create_user(args):
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
            type: array
            items:
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
              required:
                - email

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: array
              item:
                type: object
                properties:
                  uuid:
                    type: string
                    example: 16fc2db7-cac0-46c2-a0e3-2da6cec54abb
                  email:
                    type: string
                    example: test@local.com
                  alias:
                    type: string
                    example: Jeff
                  password:
                    type: string
                    example: J89Ybnq23
    """

    # limit access to admin only
    user_info = Auth.get_payload(request)
    if user_info["role"] != "ADMIN":
        raise ApiPermissionException("Permission denied: not logged in as admin")

    # check duplicate email
    for user in args:
        # TODO check input dup
        old_user = User.query.filter_by(email=user["email"]).first()
        if old_user is not None:
            raise ApiDuplicateResourceException(f"Conflict: a user with the email already exists")

    ret = []

    for user in args:
        # Generate password
        password = "".join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
        password_sha1 = hashlib.sha1(password.encode()).digest()
        password_salt = secrets.token_bytes(16)
        password_hash = hmac.new(password_salt, password_sha1, "sha1").digest()

        # create user
        new_uuid = uuid.uuid4()
        new_user = User(uuid=new_uuid.bytes,
                        email=user["email"],
                        alias=user["alias"],
                        password_salt=password_salt,
                        password_hash=password_hash,
                        creation_time=int(time.time()))
        db.session.add(new_user)
        ret.append({
            "uuid": str(new_uuid),
            "email": user["email"],
            "alias": user["alias"],
            "password": password
        })

    db.session.commit()
    return MyResponse(data=ret).build()


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
                    title:
                      type: string
                      description: group project title
                      example: GMS
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
                    title:
                      type: string
                      description: group project title
                      example: GMS
                    description:
                      type: string
                      description: group description
                      example: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    """
    args_query = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="path")

    user_uuid: str = args_query["user_uuid"]

    user = User.query.get(uuid.UUID(user_uuid).bytes)

    if user is None:
        raise ApiResourceNotFoundException("Not found: invalid user uuid")

    return MyResponse(data={
        "alias": user.alias,
        "email": user.email,
        "bio": user.bio,
        "created_group": user.owned_group and {
            "uuid": str(uuid.UUID(bytes=user.owned_group.uuid)),
            "name": user.owned_group.name,
            "title": user.owned_group.title,
            "description": user.owned_group.description
        },
        "joined_group": user.joined_group and {
            "uuid": str(uuid.UUID(bytes=user.joined_group.uuid)),
            "name": user.joined_group.name,
            "title": user.joined_group.title,
            "description": user.joined_group.description
        }
    }).build()


@user_api.route("/user/<user_uuid>", methods=["PATCH"])
def update_user_profile(user_uuid):
    """Update profile of the user
    ---
    tags:
      - user

    description: |
      ## Constrains
      * if not admin, operator must be the user to be modified
      * if not admin, email and alias cannot be modified

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
              email:
                type: string
                description: user email
                example: jeff.dean@internet.com
              alias:
                type: string
                description: user alias
                example: Jeff Dean
                min: 4
                max: 32
              bio:
                type: string
                description: user bio
                example: I write O(1/n) algorithms
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
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())}, request, location="path")

    args_json = parser.parse({
        "email": fields.Str(missing=None, validate=validate.Email()),
        "alias": fields.Str(missing=None, validate=validate.Length(min=4, max=32)),
        "bio": fields.Str(missing=None)
    }, request, location="json")

    user_uuid: str = args_path["user_uuid"]
    new_email: str = args_json["email"]
    new_alias: str = args_json["alias"]
    new_bio: str = args_json["bio"]

    token_info = Auth.get_payload(request)

    if (user_uuid != token_info["uuid"] and token_info["role"] != "ADMIN"):
        raise ApiPermissionException('Permission denied: you cannot update other user\'s profile!')

    user = User.query.get(uuid.UUID(token_info["uuid"]).bytes)

    if user is None:
        logger.debug(f"Update fail: no such user")
        raise ApiPermissionException("Permission denied: invalid credential")

    if token_info["role"] != "ADMIN" and (new_email is not None or new_alias is not None):
        raise ApiPermissionException("Permission denied: only admin can change email or alias")

    if new_email is not None:
        user.email = new_email
    if new_alias is not None:
        user.alias = new_alias
    if new_bio is not None:
        user.bio = new_bio

    db.session.commit()

    return MyResponse().build()
