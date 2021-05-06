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
    pass  # TODO


@semester_api.route("/semester", methods=["GET"])
def get_semester_name_list():
    pass  # TODO


@semester_api.route("/semester/<semester_uuid>", methods=["PATCH"])
def rename_semester(semester_uuid):
    pass  # TODO


@semester_api.route("/semester/<semester_uuid>", methods=["DELETE"])
def delete_semester(semester_uuid):
    pass  # TODO
