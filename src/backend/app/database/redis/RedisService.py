from enum import Enum
from logging import Logger

import redis

import shared


class RedisDb(Enum):
    SMS = 0
    DEVICE_TOKEN = 1
    UPLOAD_TASK = 2


class RedisHelper:
    _pool: dict
    _logger: Logger

    def __init__(self, host: str, port: int):
        self._pool = dict()
        for opt in RedisDb:
            self._pool[opt] = redis.ConnectionPool(host=host, port=port, db=opt.value)
        self._logger = shared.get_logger("Redis")


    def get(self, db: RedisDb, key: str) -> bytes:
        conn = redis.Redis(connection_pool=self._pool[db])
        self._logger.debug(f"\nGET {key}")
        ret = conn.get(key)
        return ret

    def set(self, db: RedisDb, key: str, val: str, ex: int = None):
        conn = redis.Redis(connection_pool=self._pool[db])
        self._logger.debug(f"\nSET {key} {val} {ex}")
        ret = conn.set(key, val, ex)
        return ret

    def delete(self, db: RedisDb, key: str):
        conn = redis.Redis(connection_pool=self._pool[db])
        self._logger.debug(f"\nDELETE {key}")
        ret = conn.delete(key)
        return ret

    def hgetall(self, db: RedisDb, key: str) -> dict:
        conn = redis.Redis(connection_pool=self._pool[db])
        self._logger.debug(f"\nHGETALL {key}")
        ret = conn.hgetall(key)
        return ret

    def hmset(self, db: RedisDb, key: str, val: dict):
        conn = redis.Redis(connection_pool=self._pool[db])
        self._logger.debug(f"\nHMSET {key} {val}")
        ret = conn.hmset(key, val)
        return ret
