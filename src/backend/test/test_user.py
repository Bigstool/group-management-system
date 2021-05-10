import base64
import json
import logging
from hashlib import sha1

import pytest
import requests

from test.shared import api, log_res

logger = logging.getLogger(__name__)
logger.propagate = True

user_list = [
    {
        "email": "test1@local.com",
        "alias": "User1"
    },
    {
        "email": "test2@local.com",
        "alias": "User2"
    },
    {
        "email": "test3@local.com",
        "alias": "User3"
    },
    {
        "email": "test4@local.com",
        "alias": "User4"
    },
    {
        "email": "test5@local.com",
        "alias": "User5"
    },
    {
        "email": "test6@local.com",
        "alias": "User6"
    }
]
admin_username = "superuser@test.com"
admin_password = "resurepus"
admin_alias = "Nimda"


def login(username: str, password: str):
    return requests.post(f"{api}/oauth2/token", data={
        "grant_type": "password",
        "username": username,
        "password": sha1(password.encode()).hexdigest()
    })


@pytest.fixture(scope="package")
def test_admin_sign_in():
    r = login(admin_username, admin_password)
    assert r.status_code == 200
    log_res(logger, r)
    user_token_access = r.json()["data"]["access_token"]
    user_token_refresh = r.json()["data"]["refresh_token"]
    user_uuid = json.loads(base64.b64decode(user_token_access.split(".")[1] + '==='))["uuid"]
    return {
        "token_access": user_token_access,
        "token_refresh": user_token_refresh,
        "user_uuid": user_uuid
    }


@pytest.fixture(scope="package")
def test_create_user(test_admin_sign_in):
    r = requests.post(f"{api}/user", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json=user_list)
    log_res(logger, r)
    assert r.status_code == 200
    generated_user: list = r.json()["data"]
    return {
        "generated_user": generated_user
    }


@pytest.fixture(scope="package")
def test_user_sign_in(test_create_user):
    ret = []
    for user in test_create_user["generated_user"]:
        r = login(user["email"], user["password"])
        log_res(logger, r)
        assert r.status_code == 200
        user_token_access = r.json()["data"]["access_token"]
        user_token_refresh = r.json()["data"]["refresh_token"]
        user_uuid = json.loads(base64.b64decode(user_token_access.split(".")[1] + '==='))["uuid"]
        ret.append({
            "token_access": user_token_access,
            "token_refresh": user_token_refresh,
            "user_uuid": user_uuid
        })
    return ret


def test_token_refresh(test_user_sign_in):
    r = requests.post(f"{api}/oauth2/refresh", data={
        "grant_type": "refresh",
        "refresh_token": test_user_sign_in[0]["token_refresh"]
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_update_user_profile(test_user_sign_in):
    r = requests.patch(f"{api}/user/{test_user_sign_in[0]['user_uuid']}", headers={
        "Authorization": f"Bearer {test_user_sign_in[0]['token_access']}"
    }, json={
        "bio": "Lorem ipsum"
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_update_admin_profile(test_admin_sign_in):
    r = requests.patch(f"{api}/user/{test_admin_sign_in['user_uuid']}", headers={
        "Authorization": f"Bearer {test_admin_sign_in['token_access']}"
    }, json={
        "alias": admin_alias
    })
    log_res(logger, r)
    assert r.status_code == 200


def test_get_user_profile(test_user_sign_in):
    r = requests.get(f"{api}/user/{test_user_sign_in[0]['user_uuid']}")
    log_res(logger, r)
    assert r.status_code == 200
    assert r.json()["data"]["bio"] == "Lorem ipsum"
