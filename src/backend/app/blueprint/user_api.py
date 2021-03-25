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
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
user_api = Blueprint("user_api", __name__)


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@user_api.route("/user", methods=["POST"])
def create_user():
    """Create a new user
    ---
    tags:
      - user
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

    email: str = args_json["email"]
    alias: str = args_json["alias"]
    password: str = args_json["password"]

    # check duplicate email
    old_user = User.query.filter_by(email=email).first()
    if old_user is not None:
        raise ApiDuplicateResourceException(f"Conflict: a user with the email already exists")

    # Generate password
    password_salt = secrets.token_bytes(16)
    password_hash = hmac.new(password_salt, bytes.fromhex(password), "sha1").digest()

    new_user = User(uuid=str(uuid.uuid4()),
                    email=email,
                    alias=alias,
                    password_salt=password_salt,
                    password_hash=password_hash,
                    creation_time=int(time.time()))
    db.session.add(new_user)

    return MyResponse(data=None).build()


@user_api.route("/user/<user_uuid>", methods=["GET"])
def get_user_profile(user_uuid):
    """Get profile of the user
    ---
    tags:
      - user
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
    """
    args_query = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    }, request, location="query")

    # TODO

    return MyResponse(data=None).build()


@user_api.route("/user/<user_uuid>", methods=["PATCH"])
def update_user_profile(user_uuid):
    """Update profile of the user
    ---
    tags:
      - user
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
    args_query = parser.parse({
        "user_uuid": fields.Str(required=True, validate=MyValidator.Uuid())
    })

    # TODO

    return MyResponse(data=None).build()
