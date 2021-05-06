import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from sqlalchemy.orm.attributes import flag_modified
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Semester import Semester
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
    pass  # TODO


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
    pass  # TODO


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
    pass  # TODO


@semester_api.route("/semester/<semester_uuid>", methods=["DELETE"])
def delete_semester(semester_uuid):
    pass  # TODO
