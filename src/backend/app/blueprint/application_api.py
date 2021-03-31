import hmac
import secrets
import time
import uuid

from flask import Blueprint, request
from webargs import fields, validate
from webargs.flaskparser import parser

from model.Group import Group
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
    pass # TODO


@application_api.route("/group/<group_uuid>/application", methods=["GET"])
def get_application_list(group_uuid):
    """Get list of group applications
    ---
    tags:
      - application

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
                  state:
                    type: string
                    description: current state of the application
                    example: PENDING
                    enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED"]
    """
    pass # TODO


@application_api.route("/application/<application_uuid>", methods=["PATCH"])
def update_application_info(application_uuid):
    """Update information of the application
    ---
    tags:
      - application

    parameters:
      - name: application_uuid
        in: path
        required: true
        description: application uuid
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
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam.
              state:
                type: string
                description: application state
                enum: ["PENDING", "APPROVED", "REJECTED", "REVOKED"]
                example: PENDING

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    pass # TODO