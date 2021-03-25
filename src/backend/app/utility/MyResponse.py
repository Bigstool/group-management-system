import time
from dataclasses import dataclass
from typing import Union
from flask import g

@dataclass
class MyResponse:
    data: Union[dict, list, None] = None
    status_code: int = 200
    msg: str = "Operation_successful"
    err_code: str = None

    def build(self):
        return {
            "msg": self.msg,
            "data": self.data,
            "execution_time": time.time() - g.start_time,
            "err_code": self.err_code
        }, self.status_code