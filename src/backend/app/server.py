import hmac
import os
import secrets
import time
import traceback
import uuid
from hashlib import sha1

from flasgger import Swagger
from flask import Flask, request, g
from werkzeug.exceptions import HTTPException

from blueprint.application_api import application_api
from blueprint.auth_api import auth_api
from blueprint.group_api import group_api
from blueprint.notification_api import notification_api
from blueprint.system_api import system_api
from blueprint.user_api import user_api
from model.User import User
from shared import config, get_logger, db
from utility.ApiException import ApiException
from utility.MyResponse import MyResponse

logger = get_logger(__name__)

app = Flask("GMS")

app.logger = logger


# Before each request
@app.before_request
def before_request():
    g.start_time = time.time()


# After request handler
@app.after_request
def after_request(response):
    if request.path.startswith("/docs"):  # do not log document access
        pass
    elif response.status_code >= 500:
        logger.warning(f"{request.remote_addr}: {request.method} {request.path} {response.status_code}")
    else:
        logger.info(f"{request.remote_addr}: {request.method} {request.path} {response.status_code}")
    return response


# Exception handler
@app.errorhandler(ApiException)  # controlled exception
def err_handler(e):
    return MyResponse(status_code=e.status_code,
                      msg=str(e)).build()


@app.errorhandler(HTTPException)  # HTTP exception that is out of app's control
def err_handler(e):
    return MyResponse(status_code=e.code,
                      msg=e.name).build()


@app.errorhandler(Exception)  # something bad happen and needs investigation ASAP
def err_handler(e):
    logger.error(traceback.format_exc())
    return MyResponse(status_code=500,
                      msg="Operation failed").build()


# APIs
app.register_blueprint(auth_api)
app.register_blueprint(user_api)
app.register_blueprint(group_api)
app.register_blueprint(application_api)
app.register_blueprint(system_api)
app.register_blueprint(notification_api)

# SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = \
    f"mysql+mysqlconnector://{config.get('mysql_user')}:{config.get('mysql_password')}@{config.get('mysql_host')}:{config.get('mysql_port')}/{config.get('mysql_database')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# init database
with app.app_context():
    db.create_all()  # create if table not exists
    # if user table empty
    if not User.query.first():
        logger.warning("Empty table, create admin")
        # insert admin
        password_sha1 = sha1(config["admin_password"].encode()).hexdigest()
        password_salt = secrets.token_bytes(16)
        password_hash = hmac.new(password_salt, bytes.fromhex(password_sha1), "sha1").digest()
        admin_user = User(uuid=uuid.uuid4().bytes,
                          email=config["admin_username"],
                          alias="Admin",
                          password_salt=password_salt,
                          password_hash=password_hash,
                          creation_time=int(time.time()),
                          role="ADMIN")
        db.session.add(admin_user)
        db.session.commit()
        # TODO insert dummy data

# Swagger docs
swagger_config = {
    "headers": [
    ],
    "specs": [
        {
            "endpoint": 'api_spec',
            "route": '/docs/api_spec.json',
            "rule_filter": lambda rule: True,  # all in
            "model_filter": lambda tag: True,  # all in
        }
    ],
    "static_url_path": "/docs/static",
    # "static_folder": "static",  # must be set by user
    "swagger_ui": True,
    "specs_route": "/docs/"
}
app.config['SWAGGER'] = {
    "title": "GMS API Document",
    "uiversion": 3,
    "openapi": "3.0.3"
}
swagger = Swagger(app, swagger_config)

# CORS
if bool(config.get("cors")):
    from flask_cors import CORS

    CORS(app)


def run():
    logger.info(f"bjoern listening on 0.0.0.0:{config.get('listen_port', 8080)}")
    if os.getenv("ENV", "DEV") == "PROD":
        # begin server loop
        import bjoern
        bjoern.run(app, host="0.0.0.0", port=config.get("listen_port", 8080))
    else:
        app.run(host="0.0.0.0", port=config.get("listen_port", 8080))


def stop():
    pass  # do something
