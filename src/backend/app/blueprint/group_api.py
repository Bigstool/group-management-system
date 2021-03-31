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
    pass # TODO


@group_api.route("/group", methods=["GET"])
def get_group_list():
    """Get list of group
    ---
    tags:
      - group

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
                  name:
                    type: string
                    description: group name
                    example: Jaxzefalk
                  description:
                    type: string
                    description: group description
                    example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                  creator:
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
    """
    pass # TODO


@group_api.route("/group/<group_uuid>", methods=["GET"])
def get_group_info(group_uuid):
    """Get detail info of the group
    ---
    tags:
      - group

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
                name:
                  type: string
                  description: group name
                  example: Jaxzefalk
                description:
                  type: string
                  description: group description
                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                proposal:
                  type: string
                  description: group proposal
                  example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
                creator:
                  type: object
                  description: the user who created the group
                  properties:
                    alias:
                      type: string
                      example: Ming Li
                    email:
                      type: string
                      example: Ming.Li@example.com
                member:
                  type: array
                  items:
                    type: object
                    description: the user who has joined the group
                    properties:
                      alias:
                        type: string
                        example: Ming Li
                      email:
                        type: string
                        example: Ming.Li@example.com
                comment:
                  type: array
                  items:
                    type: object
                    properties:
                      content:
                        type: string
                        description: comment for the group proposal
                        example: This is the lamest idea I've ever heard. Boo~
                      author:
                        type: object
                        description: the user who made the comment
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
    """
    pass # TODO


@group_api.route("/group/<group_uuid>", methods=["PATCH"])
def update_group_info(group_uuid):
    """Update information of the group
    ---
    tags:
      - group

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
                  description: group name
                  example: Jaxzefalk
              description:
                type: string
                description: group description
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.
              proposal:
                type: string
                description: group proposal
                example: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque a ultricies diam. Donec ultrices tortor non lobortis mattis. Mauris euismod tellus ipsum, et porta mi scelerisque ac.

    responses:
      '200':
        description: query success
        content:
          application/json:
            schema:
              type: object
    """
    pass # TODO


@group_api.route("/group/<group_uuid>", methods=["DELETE"])
def delete_group(group_uuid):
    """Delete a group
    ---
    tags:
      - group

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
    pass # TODO


@group_api.route("/group/merged", methods=["POST"])
def merge_group():
    """Merge a group to another
    ---
    tags:
      - group

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
              source_group_uuid:
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
    pass # TODO