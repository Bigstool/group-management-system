import logging

import coloredlogs
import yaml

from utility.JwtUtil import JwtUtil
from flask_sqlalchemy import SQLAlchemy

config: dict

jwt_util: JwtUtil

db: SQLAlchemy

def init(config_file: str):
    # load config
    with open(config_file) as file:
        global config
        config = yaml.load(file, Loader=yaml.FullLoader)

    # init db
    global db
    db = SQLAlchemy()

    # init jwt util
    global jwt_util
    jwt_util = JwtUtil(
        public_key=config.get("jwt_public_key", "./jwt.key.pub"),
        private_key=config.get("jwt_private_key", "./jwt.key"),
        algorithm=config.get("jwt_algorithm", "RS256")
    )

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(f"GMS/{name}")
    logger.setLevel(logging.DEBUG)
    coloredlogs.install(level=config.get("log_level", "INFO"), logger=logger)
    return logger
