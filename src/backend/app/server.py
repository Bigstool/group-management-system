import hmac
import os
import secrets
import time
import traceback
import uuid
from datetime import datetime, timedelta
from hashlib import sha1

from apscheduler.triggers.date import DateTrigger
from flask_apscheduler import APScheduler
from flasgger import Swagger
from flask import Flask, request, g
from sqlalchemy.orm.attributes import flag_modified
from werkzeug.exceptions import HTTPException

from blueprint.application_api import application_api
from blueprint.auth_api import auth_api
from blueprint.group_api import group_api, post_grouping_ddl_job
from blueprint.notification_api import notification_api
from blueprint.semester_api import semester_api
from blueprint.system_api import system_api
from blueprint.user_api import user_api
from model.Semester import Semester
from model.User import User
from model.Group import Group
from model.GroupComment import GroupComment
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
    db.session.rollback()
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
app.register_blueprint(semester_api)
app.register_blueprint(system_api)
app.register_blueprint(notification_api)

# SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = \
    f"mysql+mysqlconnector://{config.get('mysql_user')}:{config.get('mysql_password')}@{config.get('mysql_host')}:{config.get('mysql_port')}/{config.get('mysql_database')}?charset={config.get('mysql_charset')}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# init database
with app.app_context():
    # TODO!!! remove block when in prod env
    tables = db.session.execute("SELECT "
                                "table_name "
                                "FROM "
                                "information_schema.tables "
                                "WHERE "
                                f"table_schema = :db_name;",
                                {"db_name": config.get('mysql_database')})
    db.session.execute("SET FOREIGN_KEY_CHECKS = 0;")
    for table in tables:
        logger.warning(f"Delete table {table[0]}")
        db.session.execute(f"DROP TABLE `{table[0]}`;")
    db.session.execute("SET FOREIGN_KEY_CHECKS = 1;")

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
                          creation_time=0,
                          role="ADMIN",
                          initial_password=config["admin_password"])
        db.session.add(admin_user)

        # insert semester
        semester = Semester(
            uuid=uuid.uuid4().bytes,
            name="CURRENT",
            start_time=int(time.time()),
            config={
                "system_state": {
                    "grouping_ddl": None,
                    "proposal_ddl": None
                },
                "group_member_number": [7, 9]
            }
        )
        db.session.add(semester)
        db.session.commit()

        if os.getenv("ENV", "DEV") == "PROD":
            # Insert dummy data TODO!!! remove block in prod env
            # ----------------------
            # Groups
            # - Group A with name, title, description, proposal and some comments
            # - Group B with name, title, description and proposal
            #
            # Users
            # - User 1: a group owner of group A
            # - User 2: a member of group A
            # - User 3: a group owner of group B
            # - User 4: a member of group B
            # - User 5: a student that does not belong to any group
            # - User 6: a student that does not belong to any group

            semester = Semester.query.filter_by(name="CURRENT").first()
            semester.config = {
                "system_state": {
                    "grouping_ddl": int((datetime.now() + timedelta(days=30)).timestamp()),
                    # "grouping_ddl": int(time.time() + 5),
                    "proposal_ddl": int((datetime.now() + timedelta(days=60)).timestamp())
                },
                "group_member_number": [7, 9]
            }
            flag_modified(semester, "config")
            db.session.commit()

            groupA_uuid = uuid.uuid4().bytes
            groupB_uuid = uuid.uuid4().bytes
            user1_uuid = uuid.uuid4().bytes
            user2_uuid = uuid.uuid4().bytes
            user3_uuid = uuid.uuid4().bytes
            user4_uuid = uuid.uuid4().bytes
            user5_uuid = uuid.uuid4().bytes
            user6_uuid = uuid.uuid4().bytes

            password = "password"
            import hashlib

            password_sha1 = hashlib.sha1(password.encode()).digest()
            password_salt = secrets.token_bytes(16)
            password_hash = hmac.new(password_salt, password_sha1, "sha1").digest()

            user_1 = User(uuid=user1_uuid,
                          creation_time=time.time(),
                          email="user1@test.com",
                          alias='Dolores Britton',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="During my own Google interview, I was asked the implications if P=NP were true. I said, \"P = 0 or N = 1\". Then, before the interviewer had even finished laughing, I examined Google's public certificate and wrote the private key on the whiteboard.",
                          initial_password="password")
            db.session.add(user_1)
            user_2 = User(uuid=user2_uuid,
                          creation_time=time.time(),
                          email="user2@test.com",
                          alias='Ciara Philip',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="Compilers don't warn me. I warn compilers.",
                          initial_password="password"
                          )
            db.session.add(user_2)
            user_3 = User(uuid=user3_uuid,
                          creation_time=time.time(),
                          email="user3@test.com",
                          alias='Imaani Person',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="The rate at which I produce code jumped by a factor of 40 in late 2000 when I upgraded my keyboard to USB 2.0.",
                          initial_password="password")
            db.session.add(user_3)
            user_4 = User(uuid=user4_uuid,
                          creation_time=time.time(),
                          email="user4@test.com",
                          alias='Chandni Gonzalez',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="I build my code before committing it, but only to check for compiler and linker bugs.",
                          initial_password="password")
            db.session.add(user_4)
            user_5 = User(uuid=user5_uuid,
                          creation_time=time.time(),
                          email="user5@test.com",
                          alias='Kurtis Peck',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="When I has an ergonomic evaluation, it is for the protection of his keyboard.",
                          initial_password="password")
            db.session.add(user_5)
            user_6 = User(uuid=user6_uuid,
                          creation_time=time.time(),
                          email="user6@test.com",
                          alias='Layla-Mae Dudley',
                          password_salt=password_salt,
                          password_hash=password_hash,
                          role="USER",
                          bio="gcc -O4 emails your code to me for a rewrite.",
                          initial_password="password")
            db.session.add(user_6)
            db.session.commit()

            group_A = Group(uuid=groupA_uuid,
                            creation_time=time.time(),
                            name="Team Yellow",
                            title="IoT Teapot",
                            description="Implement a teapot that gives status code 418.",
                            proposal="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas placerat urna eu risus dignissim sagittis. Quisque lobortis, lacus sed bibendum blandit, erat nisi ornare mauris, ut euismod nibh elit in est. Curabitur suscipit nisi enim, quis vehicula nulla ornare et. Duis felis dolor, tempus nec odio a, facilisis maximus orci. Vivamus imperdiet mi vel interdum accumsan. Phasellus fringilla ut nulla at malesuada. Phasellus tristique finibus interdum. Phasellus eu hendrerit erat. Ut mauris sem, posuere non tincidunt eget, fringilla id justo.",
                            proposal_state="PENDING",
                            owner_uuid=user1_uuid
                            )
            db.session.add(group_A)
            group_B = Group(uuid=groupB_uuid,
                            creation_time=time.time(),
                            name="Team Blue",
                            title="IoT Coffee Machine",
                            description="Implement a coffee machine that does not give status code 418.",
                            proposal="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas placerat urna eu risus dignissim sagittis. Quisque lobortis, lacus sed bibendum blandit, erat nisi ornare mauris, ut euismod nibh elit in est. Curabitur suscipit nisi enim, quis vehicula nulla ornare et. Duis felis dolor, tempus nec odio a, facilisis maximus orci. Vivamus imperdiet mi vel interdum accumsan. Phasellus fringilla ut nulla at malesuada. Phasellus tristique finibus interdum. Phasellus eu hendrerit erat. Ut mauris sem, posuere non tincidunt eget, fringilla id justo.",
                            proposal_state="PENDING",
                            owner_uuid=user3_uuid
                            )
            db.session.add(group_B)

            db.session.commit()

            group_A.member.append(user_2)
            group_B.member.append(user_4)

            db.session.commit()

            comment1 = GroupComment(
                uuid=uuid.uuid4().bytes,
                creation_time=time.time(),
                author_uuid=user1_uuid,
                group_uuid=groupA_uuid,
                content="This is very good proposal!"
            )
            db.session.add(comment1)
            db.session.commit()

# Flask APSchedulers
# initialize scheduler
scheduler = APScheduler()
# you can set options here:
# scheduler.api_enabled = True
scheduler.init_app(app)
# scheduled task for ddl
with app.app_context():
    semester = Semester.query.filter_by(name="CURRENT").first()
    if semester.config["system_state"]["grouping_ddl"]:
        run_time = datetime.fromtimestamp(semester.config["system_state"]["grouping_ddl"])
        logger.info(f"Grouping DDL set, post grouping DDL job scheduled at {run_time}")
        scheduler.add_job(func=post_grouping_ddl_job,
                          id="POST_GROUPING_DDL",
                          replace_existing=True,
                          trigger=DateTrigger(run_date=run_time))
scheduler.start()

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
