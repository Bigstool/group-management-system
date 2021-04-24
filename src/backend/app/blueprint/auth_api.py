import hmac
import uuid
from datetime import datetime, timedelta

from durations import Duration
from flask import Blueprint, request
from sqlalchemy import desc
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Semester import Semester
from model.User import User
from shared import get_logger, jwt_util, config
from utility import MyValidator
from utility.ApiException import *
from utility.MyResponse import MyResponse

logger = get_logger(__name__)
auth_api = Blueprint("auth_api", __name__)

access_token_exp: int = Duration(config.get("access_token_validation_period", "1h")).to_seconds()
refresh_token_exp: int = Duration(config.get("refresh_token_validation_period", "30d")).to_seconds()


# webargs parser error handler
@parser.error_handler
def handle_error(error, req, schema, *, error_status_code, error_headers):
    raise ApiInvalidInputException(error.messages)


@auth_api.route("/oauth2/token", methods=["POST"])
def sign_in():
    """Get the token of a user
    ---
    tags:
      - auth
    requestBody:
      required: true
      content:
        application/x-www-form-urlencoded:
          schema:
            type: object
            properties:
              grant_type:
                type: string
                description: only "password" is supported currently
                enum:
                 - password
              username:
                type: string
                description: The resource owner's login username, only email is supported currently
                example: john.wick@example.com
              password:
                type: string
                description: sha1(password)
                example: 5F4DCC3B5AA765D61D8327DEB882CF99
            required:
              - grant_type
              - username
              - password
    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token:
                  type: string
                refresh_token:
                  type: string
                token_type:
                  type: string
                expires_in:
                  type: integer
                  format: int32
                scope:
                  type: string
                  enum:
                    - ADMIN
                    - USER
            example:
              access_token: >-
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFyIiwiaWF0IjoxNTc4MTA3NDU3LCJleHAiOjE1NzgxMTEwNTcsImF1ZCI6ImFjY2VzcyIsInN1YiI6ImZvbyJ9.YzV0loBMLmZTE3pIF7wB35-KO68f7mzGotmQhWjddho
              refresh_token: >-
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFyIiwiaWF0IjoxNTc4MTA3NDU3LCJleHAiOjE1ODA2OTk0NTcsImF1ZCI6InJlZnJlc2giLCJzdWIiOiJmb28ifQ.0cpPCRivZxN76l1JchL4yHfBWPwynmz59rW9Jjfwd6w
              token_type: bearer
              expires_in: 3600
              scope: user
    """
    args_form = parser.parse({
        "grant_type": fields.Str(required=True, validate=validate.OneOf(["password"])),
        "username": fields.Str(required=True, validate=validate.Email()),
        "password": fields.Str(required=True, validate=MyValidator.Sha1())
    }, request, location="form")

    username: str = args_form["username"]
    password: str = args_form["password"]

    # always use the latest user for the same email across semester
    user = User.query.filter_by(email=username).order_by(desc(User.creation_time)).first()

    # check existence
    if user is None:
        logger.debug(f"Login fail: no such user")
        raise ApiPermissionException("Permission denied: invalid credential")

    # check semester
    current_semester = Semester.query.filter_by(name="CURRENT").first()
    if user.creation_time < current_semester.start_time:
        logger.debug(f"Login fail: user not in current semester")
        raise ApiPermissionException("Permission denied: invalid credential")

    # check password
    password_hash = hmac.new(user.password_salt, bytes.fromhex(password), "sha1").digest()
    if password_hash != user.password_hash:
        logger.debug(f"Login fail: password mismatch")
        raise ApiPermissionException("Permission denied: invalid credential")

    user_uuid = str(uuid.UUID(bytes=user.uuid))

    # sign token
    new_access_token: str = jwt_util.encode_token({
        "uuid": user_uuid,
        "role": user.role,
        "nbf": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=access_token_exp),
        "iat": datetime.utcnow(),
        "aud": "access"
    })
    new_refresh_token: str = jwt_util.encode_token({
        "uuid": user_uuid,
        "role": user.role,
        "nbf": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=refresh_token_exp),
        "iat": datetime.utcnow(),
        "aud": "refresh"
    })
    return MyResponse(data={
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "expires_in": int(access_token_exp),
        "token_type": "bearer"
    }).build()


@auth_api.route("/oauth2/refresh", methods=["POST"])
def refresh_token():
    """Get new token by refresh token
    ---
    tags:
      - auth
    requestBody:
      required: true
      content:
        application/x-www-form-urlencoded:
          schema:
            type: object
            properties:
              grant_type:
                description: only "refresh" is supported currently
                type: string
                example: refresh
              refresh_token:
                description: The refresh token issued in the past
                type: string
                example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFyIiwiaWF0IjoxNTc4MTA3NDU3LCJleHAiOjE1ODA2OTk0NTcsImF1ZCI6InJlZnJlc2giLCJzdWIiOiJmb28ifQ.0cpPCRivZxN76l1JchL4yHfBWPwynmz59rW9Jjfwd6w
            required:
              - grant_type
              - refresh_token
    responses:
      200:
        description: query success
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token:
                  type: string
                refresh_token:
                  type: string
                token_type:
                  type: string
                expires_in:
                  type: integer
                  format: int32
                scope:
                  type: string
                  enum:
                    - ADMIN
                    - USER
            example:
              access_token: >-
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFyIiwiaWF0IjoxNTc4MTA3NDU3LCJleHAiOjE1NzgxMTEwNTcsImF1ZCI6ImFjY2VzcyIsInN1YiI6ImZvbyJ9.YzV0loBMLmZTE3pIF7wB35-KO68f7mzGotmQhWjddho
              refresh_token: >-
                eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYmFyIiwiaWF0IjoxNTc4MTA3NDU3LCJleHAiOjE1ODA2OTk0NTcsImF1ZCI6InJlZnJlc2giLCJzdWIiOiJmb28ifQ.0cpPCRivZxN76l1JchL4yHfBWPwynmz59rW9Jjfwd6w
              token_type: bearer
              expires_in: 3600
              scope: user
    """
    args_form = parser.parse({
        "grant_type": fields.Str(required=True, validate=validate.Equal("refresh")),
        "refresh_token": fields.Str(required=True)
    }, request, location="form")

    # decode refresh token
    decoded: dict
    try:
        decoded = jwt_util.decode_token(args_form["refresh_token"], audience="refresh")
    except Exception as e:
        raise ApiPermissionException(str(e))

    uuid: str = decoded.get("uuid")
    scope: str = decoded.get("operator_type")

    new_access_token: str = jwt_util.encode_token({
        "uuid": uuid,
        "operator_type": scope,
        "nbf": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=access_token_exp),
        "iat": datetime.utcnow(),
        "aud": "access"
    })
    new_refresh_token: str = jwt_util.encode_token({
        "uuid": uuid,
        "operator_type": scope,
        "nbf": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(seconds=refresh_token_exp),
        "iat": datetime.utcnow(),
        "aud": "refresh"
    })

    return MyResponse(data={
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "expires_in": int(access_token_exp),
        "scope": scope,
        "token_type": "bearer"
    }).build()
