import time
import traceback

import bjoern
from flasgger import Swagger
from flask import Flask, request, g
from werkzeug.exceptions import HTTPException

from blueprint.auth_api import auth_api
from shared import config, get_logger
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
    if request.path.startswith("/frps_handler"):
        logger.debug(f"{request.remote_addr}: FRP({request.args['op']}) {response.status_code}")
    elif request.path.startswith("/docs"):  # do not log document access
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
    "title": "VSAIS™ API Document",
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
    # begin server loop
    bjoern.run(app, host="0.0.0.0", port=config.get("listen_port", 8080))


def stop():
    pass  # do something
