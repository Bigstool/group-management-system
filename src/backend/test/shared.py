from logging import Logger
from pprint import pformat

import requests

api = "http://localhost:8080"

def log_res(logger:Logger, r: requests.Response):
    logger.info('\n' + r.request.method + ' ' + r.url + '\n' + pformat(r.json()) + '\n')