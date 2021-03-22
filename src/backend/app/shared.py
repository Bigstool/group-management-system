import logging

import coloredlogs
import yaml

from database.mysql.MysqlService import MysqlHelper
from database.redis.RedisService import RedisHelper
from utility.JwtUtil import JwtUtil

config: dict

jwt_util: JwtUtil

redis_helper: RedisHelper

mysql_helper: MysqlHelper


def init(config_file: str):
    # load config
    with open(config_file) as file:
        global config
        config = yaml.load(file, Loader=yaml.FullLoader)

    # must init db before others
    # init Redis
    global redis_helper
    redis_helper = RedisHelper(
        host=config.get("redis_host"),
        port=config.get("redis_port"))
    # init MySQL
    global mysql_helper
    mysql_helper = MysqlHelper({
        "pool_size": config.get("mysql_pool_size", 16),
        "host": config.get("mysql_host"),
        "port": config.get("mysql_port"),
        "user": config.get("mysql_user"),
        "password": config.get("mysql_password"),
        "db": config.get("mysql_database"),
        "charset": config.get("mysql_charset", "utf8mb4")})
    # init jwt util
    global jwt_util
    jwt_util = JwtUtil(
        public_key=config.get("jwt_public_key", "./jwt.prod.key.pub"),
        private_key=config.get("jwt_private_key", "./jwt.prod.key"),
        algorithm=config.get("jwt_algorithm", "RS256")
    )


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(f"GMS/{name}")
    logger.setLevel(logging.DEBUG)
    coloredlogs.install(level=config.get("log_level", "INFO"), logger=logger)
    return logger
